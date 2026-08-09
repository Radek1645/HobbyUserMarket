"use client";

import {
  COMPARE_SUGGEST_FUNCTION_NAME,
  COMPARE_SUGGEST_UI,
} from "@/config/compare-suggest-from-photos";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { ModerationImageReference } from "@/lib/moderation/prepare-moderation-images";

export type CompareSuggestProvider = "gemini" | "openai";

export type CompareSuggestArmSpec = {
  label: string;
  provider: CompareSuggestProvider;
  model: string;
};

export type CompareSuggestArmOk = {
  ok: true;
  label: string;
  provider: CompareSuggestProvider;
  model: string;
  latencyMs: number;
  title: string;
  description: string;
  categoryType: string;
  subcategorySlug: string | null;
  confidenceScore: number;
};

export type CompareSuggestArmError = {
  ok: false;
  label: string;
  provider: CompareSuggestProvider;
  model: string;
  errorCode: string;
};

export type CompareSuggestSuccess = {
  ok: true;
  armA: CompareSuggestArmOk | CompareSuggestArmError;
  armB: CompareSuggestArmOk | CompareSuggestArmError;
};

export type CompareSuggestFailure = {
  ok: false;
  message: string;
  errorCode?: string;
};

type CompareOkBody = {
  status: "OK";
  armA: CompareSuggestArmOk | CompareSuggestArmError;
  armB: CompareSuggestArmOk | CompareSuggestArmError;
};

type CompareErrorBody = {
  error?: string;
  message?: string;
  errorCode?: string;
  reason?: string;
};

async function readFunctionErrorPayload(
  error: unknown,
): Promise<CompareErrorBody | null> {
  if (!(error instanceof FunctionsHttpError)) return null;
  try {
    const body = await error.context.json();
    if (body && typeof body === "object") {
      return body as CompareErrorBody;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function isArmResult(
  value: unknown,
): value is CompareSuggestArmOk | CompareSuggestArmError {
  if (!value || typeof value !== "object") return false;
  const arm = value as Record<string, unknown>;
  return typeof arm.ok === "boolean" && typeof arm.provider === "string";
}

/** Volá Edge `compare-suggest-from-photos` (staff JWT). */
export async function compareSuggestFromPhotos(params: {
  imageReferences: ModerationImageReference[];
  armA: CompareSuggestArmSpec;
  armB: CompareSuggestArmSpec;
}): Promise<CompareSuggestSuccess | CompareSuggestFailure> {
  const supabase = createClient();

  const { data, error } = await supabase.functions.invoke(
    COMPARE_SUGGEST_FUNCTION_NAME,
    {
      body: {
        imageReferences: params.imageReferences,
        armA: params.armA,
        armB: params.armB,
      },
    },
  );

  if (error) {
    const payload = await readFunctionErrorPayload(error);
    if (payload) {
      if (payload.error === "FORBIDDEN" || payload.errorCode === "FORBIDDEN") {
        return {
          ok: false,
          message: payload.message ?? COMPARE_SUGGEST_UI.forbidden,
          errorCode: "FORBIDDEN",
        };
      }
      return {
        ok: false,
        message:
          payload.message ??
          payload.reason ??
          COMPARE_SUGGEST_UI.technicalError,
        errorCode: payload.errorCode ?? payload.error,
      };
    }
    return {
      ok: false,
      message: COMPARE_SUGGEST_UI.technicalError,
    };
  }

  const body = data as CompareOkBody | CompareErrorBody | null;
  if (!body || typeof body !== "object") {
    return { ok: false, message: COMPARE_SUGGEST_UI.technicalError };
  }

  if ("error" in body && body.error) {
    return {
      ok: false,
      message:
        body.message ?? body.reason ?? COMPARE_SUGGEST_UI.technicalError,
      errorCode: body.errorCode ?? body.error,
    };
  }

  if ("status" in body && body.status === "OK") {
    const okBody = body as CompareOkBody;
    if (!isArmResult(okBody.armA) || !isArmResult(okBody.armB)) {
      return { ok: false, message: COMPARE_SUGGEST_UI.technicalError };
    }
    return { ok: true, armA: okBody.armA, armB: okBody.armB };
  }

  return { ok: false, message: COMPARE_SUGGEST_UI.technicalError };
}
