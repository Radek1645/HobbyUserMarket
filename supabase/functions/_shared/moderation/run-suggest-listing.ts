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

export type SuggestAiProvider = "gemini" | "openai";

export type SuggestListingInferenceResult = {
  provider: SuggestAiProvider;
  model: string;
  suggestion: SuggestListingParsed;
  latencyMs: number;
};

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
