export type SuggestAiProvider = "gemini" | "openai";

export type SuggestAiTarget = {
  provider: SuggestAiProvider;
  model: string;
};

export type SuggestAiTargets = {
  primary: SuggestAiTarget;
  fallback: SuggestAiTarget | null;
};

const DEFAULT_SUGGEST_GEMINI_MODEL = "gemini-3.5-flash-lite";
const DEFAULT_SUGGEST_OPENAI_MODEL = "gpt-5.4-nano";

export function resolveSuggestGeminiModel(): string {
  return (
    Deno.env.get("SUGGEST_LISTING_MODEL")?.trim() ||
    DEFAULT_SUGGEST_GEMINI_MODEL
  );
}

export function resolveSuggestOpenAiModel(): string {
  return (
    Deno.env.get("SUGGEST_FALLBACK_MODEL")?.trim() ||
    DEFAULT_SUGGEST_OPENAI_MODEL
  );
}

function hasSuggestProviderKey(provider: SuggestAiProvider): boolean {
  const keyName =
    provider === "gemini" ? "GEMINI_API_KEY" : "OPENAI_API_KEY";
  return Boolean(Deno.env.get(keyName)?.trim());
}

/**
 * Vybere produkční prefill cíle podle dostupných klíčů.
 * OpenAI bez Gemini je aktuální primary, proto nejde o použitý fallback.
 */
export function resolveSuggestAiTargets(): SuggestAiTargets {
  const hasGemini = hasSuggestProviderKey("gemini");
  const hasOpenAi = hasSuggestProviderKey("openai");

  if (hasGemini) {
    return {
      primary: {
        provider: "gemini",
        model: resolveSuggestGeminiModel(),
      },
      fallback: hasOpenAi
        ? {
            provider: "openai",
            model: resolveSuggestOpenAiModel(),
          }
        : null,
    };
  }

  if (hasOpenAi) {
    return {
      primary: {
        provider: "openai",
        model: resolveSuggestOpenAiModel(),
      },
      fallback: null,
    };
  }

  throw new Error("AI_KEYS_MISSING");
}
