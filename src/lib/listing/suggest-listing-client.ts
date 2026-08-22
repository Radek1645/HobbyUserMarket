"use client";

import {
  SUGGEST_FROM_PHOTOS_FUNCTION_NAME,
  SUGGEST_FROM_PHOTOS_RATE_LIMIT_PER_HOUR,
  SUGGEST_FROM_PHOTOS_UI,
} from "@/config/suggest-from-photos";
import { formatDoplnitPlaceholders } from "@/lib/listing/doplnit-prompts";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { isGoodsCategoryType } from "@/config/goods-categories";
import type { CategoryType } from "@/types/post";
import type { ModerationImageReference } from "@/lib/moderation/prepare-moderation-images";

export type SuggestListingSuccess = {
  ok: true;
  title: string;
  description: string;
  categoryType: CategoryType;
  subcategorySlug: string | null;
  confidenceScore: number;
};

export type SuggestListingFailure = {
  ok: false;
  kind: "rejected" | "rate_limit" | "error" | "captcha_required";
  message: string;
  errorCode?: string;
};

type SuggestListingOkBody = {
  status: "OK";
  title: string;
  description: string;
  categoryType: string;
  subcategorySlug: string | null;
  confidenceScore: number;
};

type SuggestListingRejectedBody = {
  status: "REJECTED";
  reason?: string;
  errorCode?: string;
};

type SuggestListingErrorBody = {
  error?: string;
  message?: string;
  errorCode?: string;
};

async function readFunctionErrorPayload(
  error: unknown,
): Promise<SuggestListingErrorBody | null> {
  if (!(error instanceof FunctionsHttpError)) return null;
  try {
    const body = await error.context.json();
    if (body && typeof body === "object") {
      return body as SuggestListingErrorBody;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function mapErrorBody(
  body: SuggestListingErrorBody,
): SuggestListingFailure {
  const code = body.errorCode ?? body.error;
  if (code === "CAPTCHA_REQUIRED" || body.error === "CAPTCHA_REQUIRED") {
    return {
      ok: false,
      kind: "captcha_required",
      message:
        body.message ?? "Potvrďte, že nejste robot, a zkuste to znovu.",
      errorCode: "CAPTCHA_REQUIRED",
    };
  }
  if (code === "RATE_LIMIT" || body.error === "RATE_LIMIT") {
    return {
      ok: false,
      kind: "rate_limit",
      message: body.message ?? SUGGEST_FROM_PHOTOS_UI.rateLimitMessage,
      errorCode: "RATE_LIMIT",
    };
  }
  if (
    code === "GUEST_VISITOR_REQUIRED" ||
    body.error === "GUEST_VISITOR_REQUIRED"
  ) {
    return {
      ok: false,
      kind: "error",
      message:
        body.message ?? "Návštěvnická relace není platná. Obnovte stránku.",
      errorCode: "GUEST_VISITOR_REQUIRED",
    };
  }
  return {
    ok: false,
    kind: "error",
    message: body.message ?? SUGGEST_FROM_PHOTOS_UI.technicalError,
    errorCode: typeof code === "string" ? code : undefined,
  };
}

/**
 * Volá Edge `suggest-listing-from-photos` (auth JWT nebo guest visitor + token).
 */
export async function suggestListingFromPhotos(params: {
  imageReferences: ModerationImageReference[];
  guestVisitorId?: string;
  guestVisitorToken?: string;
  turnstileToken?: string | null;
}): Promise<SuggestListingSuccess | SuggestListingFailure> {
  const supabase = createClient();

  const { data, error } = await supabase.functions.invoke(
    SUGGEST_FROM_PHOTOS_FUNCTION_NAME,
    {
      body: {
        imageReferences: params.imageReferences,
        ...(params.guestVisitorId
          ? { guestVisitorId: params.guestVisitorId }
          : {}),
        ...(params.guestVisitorToken
          ? { guestVisitorToken: params.guestVisitorToken }
          : {}),
        ...(params.turnstileToken
          ? { turnstileToken: params.turnstileToken }
          : {}),
      },
    },
  );

  if (error) {
    const payload = await readFunctionErrorPayload(error);
    if (payload) {
      const mapped = mapErrorBody(payload);
      if (mapped.kind === "rate_limit" && !payload.message) {
        return {
          ...mapped,
          message: SUGGEST_FROM_PHOTOS_UI.rateLimitMessage.replace(
            "limitu AI předvyplnění",
            `limitu AI předvyplnění (max. ${SUGGEST_FROM_PHOTOS_RATE_LIMIT_PER_HOUR})`,
          ),
        };
      }
      return mapped;
    }
    if (error.message?.includes("429")) {
      return {
        ok: false,
        kind: "rate_limit",
        message: SUGGEST_FROM_PHOTOS_UI.rateLimitMessage,
        errorCode: "RATE_LIMIT",
      };
    }
    return {
      ok: false,
      kind: "error",
      message: SUGGEST_FROM_PHOTOS_UI.technicalError,
    };
  }

  const body = data as
    | SuggestListingOkBody
    | SuggestListingRejectedBody
    | SuggestListingErrorBody
    | null;

  if (!body || typeof body !== "object") {
    return {
      ok: false,
      kind: "error",
      message: SUGGEST_FROM_PHOTOS_UI.technicalError,
    };
  }

  if ("error" in body && body.error) {
    return mapErrorBody(body as SuggestListingErrorBody);
  }

  if ("status" in body && body.status === "REJECTED") {
    const rejected = body as SuggestListingRejectedBody;
    return {
      ok: false,
      kind: "rejected",
      message: rejected.reason ?? SUGGEST_FROM_PHOTOS_UI.nsfwReject,
      errorCode: rejected.errorCode,
    };
  }

  if ("status" in body && body.status === "OK") {
    const okBody = body as SuggestListingOkBody;
    const categoryType = okBody.categoryType?.trim();
    if (!isGoodsCategoryType(categoryType)) {
      return {
        ok: false,
        kind: "error",
        message: SUGGEST_FROM_PHOTOS_UI.technicalError,
        errorCode: "INVALID_CATEGORY",
      };
    }

    return {
      ok: true,
      title: String(okBody.title ?? "").trim(),
      description: formatDoplnitPlaceholders(
        String(okBody.description ?? ""),
      ),
      categoryType,
      subcategorySlug:
        typeof okBody.subcategorySlug === "string" &&
        okBody.subcategorySlug.trim()
          ? okBody.subcategorySlug.trim()
          : null,
      confidenceScore:
        typeof okBody.confidenceScore === "number"
          ? okBody.confidenceScore
          : 0,
    };
  }

  return {
    ok: false,
    kind: "error",
    message: SUGGEST_FROM_PHOTOS_UI.technicalError,
  };
}
