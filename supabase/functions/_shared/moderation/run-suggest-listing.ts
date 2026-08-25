/**
 * Jedno AI volání suggest-from-photos pipeline (prompt + schema + parse).
 * Sdílené produkčním suggestem i compare labem — liší se jen provider/model.
 */
import { callGeminiModeration } from "./gemini.ts";
import { callOpenAiModeration } from "./openai.ts";
import {
  GEMINI_SUGGEST_LISTING_RESPONSE_SCHEMA,
  OPENAI_SUGGEST_LISTING_RESPONSE_SCHEMA,
} from "./response-schema.ts";
import {
  buildSuggestListingSystemPrompt,
  buildSuggestListingUserPrompt,
  parseSuggestListingResponse,
  type SuggestListingParsed,
} from "./suggest-listing.ts";
import {
  resolveSuggestAiTargets,
  type SuggestAiProvider,
  type SuggestAiTarget,
} from "./resolve-suggest-ai-target.ts";

export type { SuggestAiProvider } from "./resolve-suggest-ai-target.ts";

export type SuggestListingInferenceResult = {
  provider: SuggestAiProvider;
  model: string;
  suggestion: SuggestListingParsed;
  latencyMs: number;
};

export type SuggestListingWithFallbackResult =
  SuggestListingInferenceResult & {
    usedFallback: boolean;
  };

const SUGGEST_GEMINI_TIMEOUT_MS = 12_000;
const SUGGEST_OPENAI_TIMEOUT_MS = 8_000;

function readErrorCode(error: unknown): string {
  return error instanceof Error ? error.message : "UNKNOWN_AI_ERROR";
}

function resolveSuggestProviderTimeoutMs(provider: SuggestAiProvider): number {
  return provider === "gemini"
    ? SUGGEST_GEMINI_TIMEOUT_MS
    : SUGGEST_OPENAI_TIMEOUT_MS;
}

function capTimeoutToDeadline(
  maxTimeoutMs: number,
  deadlineAtMs: number | undefined,
  reservedMs = 0,
): number {
  if (deadlineAtMs === undefined) {
    return maxTimeoutMs;
  }

  const availableMs = deadlineAtMs - Date.now() - reservedMs;
  if (availableMs <= 0) {
    throw new Error("SUGGEST_REQUEST_BUDGET_EXHAUSTED");
  }

  return Math.min(maxTimeoutMs, availableMs);
}

export class SuggestListingInferenceError extends Error {
  constructor(
    message: "SUGGEST_PROVIDER_FAILED" | "SUGGEST_BOTH_PROVIDERS_FAILED",
    readonly primaryTarget: SuggestAiTarget,
    readonly primaryError: unknown,
    readonly fallbackTarget: SuggestAiTarget | null,
    readonly fallbackError: unknown | null,
  ) {
    super(message);
    this.name = "SuggestListingInferenceError";
  }
}

export function isSuggestAiProvider(
  value: unknown,
): value is SuggestAiProvider {
  return value === "gemini" || value === "openai";
}

/** Spustí klasifikaci/prefill jedním modelem; stejný prompt i parse jako produkce. */
export async function runSuggestListingInference(params: {
  provider: SuggestAiProvider;
  model: string;
  imagesBase64: string[];
  imageMimeTypes: string[];
  timeoutMs?: number;
}): Promise<SuggestListingInferenceResult> {
  const model = params.model.trim();
  if (!model) {
    throw new Error("SUGGEST_MODEL_REQUIRED");
  }

  const systemPrompt = buildSuggestListingSystemPrompt();
  const userPrompt = buildSuggestListingUserPrompt(params.imagesBase64.length);
  const startedAt = Date.now();

  let rawResponse: string;
  if (params.provider === "gemini") {
    rawResponse = await callGeminiModeration({
      systemPrompt,
      userPrompt,
      imagesBase64: params.imagesBase64,
      imageMimeTypes: params.imageMimeTypes,
      model,
      responseSchema: GEMINI_SUGGEST_LISTING_RESPONSE_SCHEMA,
      timeoutMs: params.timeoutMs,
    });
  } else {
    rawResponse = await callOpenAiModeration({
      systemPrompt,
      userPrompt,
      imagesBase64: params.imagesBase64,
      imageMimeTypes: params.imageMimeTypes,
      model,
      responseSchema: OPENAI_SUGGEST_LISTING_RESPONSE_SCHEMA,
      responseSchemaName: "suggest_listing_result",
      timeoutMs: params.timeoutMs,
    });
  }

  const latencyMs = Date.now() - startedAt;
  const suggestion = parseSuggestListingResponse(rawResponse);

  return {
    provider: params.provider,
    model,
    suggestion,
    latencyMs,
  };
}

/** Produkční prefill: Gemini primary, OpenAI fallback v samostatném rozpočtu. */
export async function runSuggestListingWithFallback(params: {
  imagesBase64: string[];
  imageMimeTypes: string[];
  /** Deadline celého Edge requestu; chrání rezervu pro fallback a logování. */
  deadlineAtMs?: number;
}): Promise<SuggestListingWithFallbackResult> {
  const targets = resolveSuggestAiTargets();

  try {
    const fallbackReserveMs = targets.fallback
      ? resolveSuggestProviderTimeoutMs(targets.fallback.provider)
      : 0;
    const result = await runSuggestListingInference({
      imagesBase64: params.imagesBase64,
      imageMimeTypes: params.imageMimeTypes,
      ...targets.primary,
      timeoutMs: capTimeoutToDeadline(
        resolveSuggestProviderTimeoutMs(targets.primary.provider),
        params.deadlineAtMs,
        fallbackReserveMs,
      ),
    });
    return { ...result, usedFallback: false };
  } catch (primaryError) {
    if (!targets.fallback) {
      throw new SuggestListingInferenceError(
        "SUGGEST_PROVIDER_FAILED",
        targets.primary,
        primaryError,
        null,
        null,
      );
    }

    console.warn(
      "suggest-listing primary failed:",
      JSON.stringify({
        provider: targets.primary.provider,
        model: targets.primary.model,
        errorCode: readErrorCode(primaryError),
      }),
    );

    try {
      const result = await runSuggestListingInference({
        imagesBase64: params.imagesBase64,
        imageMimeTypes: params.imageMimeTypes,
        ...targets.fallback,
        timeoutMs: capTimeoutToDeadline(
          resolveSuggestProviderTimeoutMs(targets.fallback.provider),
          params.deadlineAtMs,
        ),
      });
      return { ...result, usedFallback: true };
    } catch (fallbackError) {
      throw new SuggestListingInferenceError(
        "SUGGEST_BOTH_PROVIDERS_FAILED",
        targets.primary,
        primaryError,
        targets.fallback,
        fallbackError,
      );
    }
  }
}
