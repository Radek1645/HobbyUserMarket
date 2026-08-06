/**
 * Výběr provideru/modelu podle fáze AI kontroly.
 * Preview = hydratace (silný model); final = issueApproval validace (rychlejší default).
 */

export type ModerationAiPhase = "preview" | "final";
export type ModerationAiProvider = "gemini" | "openai";

export type ModerationAiTarget = {
  provider: ModerationAiProvider;
  model: string;
};

const DEFAULT_PREVIEW_GEMINI_MODEL = "gemini-2.5-flash";
const DEFAULT_FINAL_GEMINI_MODEL = "gemini-3.5-flash-lite";
const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";

function normalizeProvider(raw: string | undefined): ModerationAiProvider | null {
  const value = raw?.trim().toLowerCase();
  if (value === "gemini" || value === "openai") return value;
  return null;
}

/** Preview (hydratace): GEMINI_MODEL, jinak gemini-2.5-flash. */
export function resolvePreviewGeminiModel(): string {
  return Deno.env.get("GEMINI_MODEL")?.trim() || DEFAULT_PREVIEW_GEMINI_MODEL;
}

/** OpenAI model pro fallback / final openai: OPENAI_MODERATION_MODEL. */
export function resolveOpenAiModerationModelName(): string {
  return (
    Deno.env.get("OPENAI_MODERATION_MODEL")?.trim() || DEFAULT_OPENAI_MODEL
  );
}

/**
 * Primární cíl pro danou fázi (bez fallbacku).
 * Final: MODERATION_FINAL_PROVIDER + MODERATION_FINAL_MODEL.
 */
export function resolveModerationAiPrimary(
  phase: ModerationAiPhase,
): ModerationAiTarget {
  if (phase === "preview") {
    return {
      provider: "gemini",
      model: resolvePreviewGeminiModel(),
    };
  }

  const provider =
    normalizeProvider(Deno.env.get("MODERATION_FINAL_PROVIDER")) ?? "gemini";

  const configuredModel = Deno.env.get("MODERATION_FINAL_MODEL")?.trim();
  if (configuredModel) {
    return { provider, model: configuredModel };
  }

  if (provider === "openai") {
    return { provider, model: resolveOpenAiModerationModelName() };
  }

  return { provider: "gemini", model: DEFAULT_FINAL_GEMINI_MODEL };
}

/** Fallback cíl po selhání primary (druhý dostupný provider). */
export function resolveModerationAiFallback(
  primary: ModerationAiTarget,
): ModerationAiTarget | null {
  if (primary.provider === "gemini") {
    return {
      provider: "openai",
      model: resolveOpenAiModerationModelName(),
    };
  }

  return {
    provider: "gemini",
    model: resolvePreviewGeminiModel(),
  };
}
