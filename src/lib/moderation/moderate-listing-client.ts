"use client";

import {
  MODERATION_DEFAULT_REJECTION_REASON,
  MODERATION_FUNCTION_NAME,
  MODERATION_RATE_LIMIT_MESSAGE,
  MODERATION_RATE_LIMIT_PER_HOUR,
  MODERATION_TECHNICAL_ERROR,
} from "@/config/moderation";
import { createClient } from "@/lib/supabase/client";
import type {
  ListingModerationFailure,
  ListingModerationInput,
  ListingModerationSuccess,
  ModerateListingResponse,
} from "@/lib/moderation/types";

function mapResponse(
  response: ModerateListingResponse,
  title: string,
  description: string,
): ListingModerationSuccess | ListingModerationFailure {
  if (response.status === "REJECTED") {
    return {
      ok: false,
      kind: "rejected",
      reason: response.reason ?? MODERATION_DEFAULT_REJECTION_REASON,
      topicId: response.rejectedTopicId,
    };
  }

  if (response.status === "NEEDS_QUESTIONS") {
    return {
      ok: true,
      skipped: false,
      cleanedTitle: response.cleanedTitle ?? title,
      cleanedDescription: response.cleanedDescription ?? description,
      questions: response.questions,
    };
  }

  return {
    ok: true,
    skipped: false,
    cleanedTitle: response.cleanedTitle ?? title,
    cleanedDescription: response.cleanedDescription ?? description,
  };
}

function technicalFailure(message: string): ListingModerationFailure {
  return { ok: false, kind: "error", error: message };
}

/** Volá Supabase Edge Function — až po `supabase functions deploy`. */
export async function invokeModerateListing(
  input: ListingModerationInput,
): Promise<ListingModerationSuccess | ListingModerationFailure> {
  const supabase = createClient();
  const { data, error } = await supabase.functions.invoke<ModerateListingResponse>(
    MODERATION_FUNCTION_NAME,
    {
      body: {
        intent: input.intent,
        title: input.title,
        description: input.description,
        categoryType: input.categoryType,
        subcategorySlug: input.subcategorySlug,
      },
    },
  );

  if (error) {
    const message = error.message ?? "";
    if (message.includes("429") || message.toLowerCase().includes("rate limit")) {
      return technicalFailure(
        MODERATION_RATE_LIMIT_MESSAGE(MODERATION_RATE_LIMIT_PER_HOUR),
      );
    }

    console.error("invokeModerateListing:", error);
    return technicalFailure(MODERATION_TECHNICAL_ERROR);
  }

  if (!data) {
    return technicalFailure("AI kontrola nevrátila odpověď. Zkus to znovu.");
  }

  return mapResponse(data, input.title, input.description);
}
