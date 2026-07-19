"use client";

import {
  MODERATION_CLIENT_MAX_ATTEMPTS,
  MODERATION_CLIENT_RETRY_DELAYS_MS,
  MODERATION_DEFAULT_REJECTION_REASON,
  MODERATION_FUNCTION_NAME,
  MODERATION_MAX_QUESTIONS,
  MODERATION_RATE_LIMIT_MESSAGE,
  MODERATION_RATE_LIMIT_PER_HOUR,
  MODERATION_TECHNICAL_ERROR,
} from "@/config/moderation";
import { FunctionsHttpError } from "@supabase/supabase-js";
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
      questions: response.questions?.slice(0, MODERATION_MAX_QUESTIONS),
      approvalToken: response.approvalToken ?? undefined,
    };
  }

  return {
    ok: true,
    skipped: false,
    cleanedTitle: response.cleanedTitle ?? title,
    cleanedDescription: response.cleanedDescription ?? description,
    approvalToken: response.approvalToken ?? undefined,
  };
}

function technicalFailure(message: string): ListingModerationFailure {
  return { ok: false, kind: "error", error: message };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/** Auth / rate limit — další pokus nemá smysl. */
function shouldRetryTechnicalError(message: string): boolean {
  const normalized = message.toLowerCase();
  if (normalized.includes("sezení") || normalized.includes("přihlaste")) {
    return false;
  }
  if (normalized.includes("příliš mnoho")) {
    return false;
  }
  return true;
}

type ParsedInvokeError =
  | { type: "technical"; message: string }
  | { type: "moderation"; body: ModerateListingResponse };

async function parseInvokeError(
  error: unknown,
): Promise<ParsedInvokeError | null> {
  if (!(error instanceof FunctionsHttpError)) {
    return null;
  }

  const response = error.context;
  if (!(response instanceof Response)) {
    return null;
  }

  try {
    const body = (await response.clone().json()) as ModerateListingResponse & {
      error?: string;
      message?: string;
    };
    if (body?.error === "AUTH_REQUIRED") {
      return null;
    }
    // P8/U1: technické selhání Edge Function nemá být mapované jako REJECTED.
    if (body?.error === "TECHNICAL_ERROR") {
      const message =
        typeof body.message === "string" && body.message.trim()
          ? body.message.trim()
          : MODERATION_TECHNICAL_ERROR;
      return { type: "technical", message };
    }
    if (body?.status) {
      return { type: "moderation", body };
    }
    return null;
  } catch {
    return null;
  }
}

async function invokeModerateListingOnce(
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
        ...(input.conditionLabel
          ? { conditionLabel: input.conditionLabel }
          : {}),
        ...(input.conditionLabelText
          ? { conditionLabelText: input.conditionLabelText }
          : {}),
        ...(input.conditionFieldLabel
          ? { conditionFieldLabel: input.conditionFieldLabel }
          : {}),
        ...(input.eventDate ? { eventDate: input.eventDate } : {}),
        ...(input.priceType ? { priceType: input.priceType } : {}),
        ...(input.priceTypeLabel
          ? { priceTypeLabel: input.priceTypeLabel }
          : {}),
        ...(input.priceAmount != null ? { priceAmount: input.priceAmount } : {}),
        ...(input.images
          ? {
              imagesBase64: input.images.imagesBase64,
              mainImageIndex: input.images.mainImageIndex,
            }
          : {}),
      },
    },
  );

  if (error) {
    const message = error.message ?? "";
    if (message.includes("401") || message.toLowerCase().includes("unauthorized")) {
      return technicalFailure(
        "Sezení vypršelo. Obnovte stránku a přihlaste se znovu.",
      );
    }
    if (message.includes("429") || message.toLowerCase().includes("rate limit")) {
      return technicalFailure(
        MODERATION_RATE_LIMIT_MESSAGE(MODERATION_RATE_LIMIT_PER_HOUR),
      );
    }

    const parsed = await parseInvokeError(error);
    if (parsed?.type === "technical") {
      return technicalFailure(parsed.message);
    }
    if (parsed?.type === "moderation") {
      return mapResponse(parsed.body, input.title, input.description);
    }

    console.error("invokeModerateListing:", error);
    return technicalFailure(MODERATION_TECHNICAL_ERROR);
  }

  if (!data) {
    return technicalFailure("AI kontrola nevrátila odpověď. Zkuste to prosím znovu.");
  }

  return mapResponse(data, input.title, input.description);
}

/** Volá Supabase Edge Function — až po `supabase functions deploy`. */
export async function invokeModerateListing(
  input: ListingModerationInput,
): Promise<ListingModerationSuccess | ListingModerationFailure> {
  let lastResult: ListingModerationSuccess | ListingModerationFailure | null =
    null;

  for (let attempt = 0; attempt < MODERATION_CLIENT_MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) {
      const delayMs =
        MODERATION_CLIENT_RETRY_DELAYS_MS[attempt - 1] ??
        MODERATION_CLIENT_RETRY_DELAYS_MS[
          MODERATION_CLIENT_RETRY_DELAYS_MS.length - 1
        ];
      await delay(delayMs);
    }

    lastResult = await invokeModerateListingOnce(input);

    if (lastResult.ok || lastResult.kind === "rejected") {
      return lastResult;
    }

    if (!shouldRetryTechnicalError(lastResult.error)) {
      return lastResult;
    }
  }

  return lastResult ?? technicalFailure(MODERATION_TECHNICAL_ERROR);
}
