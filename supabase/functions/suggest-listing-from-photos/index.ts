/**
 * Edge Function: AI předvyplnění inzerátu zboží z 1–2 fotek.
 *
 * Deploy:
 *   1. npm run sync:moderation
 *   2. supabase functions deploy suggest-listing-from-photos
 *
 * Auth: přihlášený JWT, nebo guest (visitorId + signed token) jako u moderate-listing preview.
 * Nezasahuje do moderate-listing (publish gate).
 */
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";
import {
  loadModerationImagesFromStorage,
  type StorageImageReference,
} from "../_shared/moderation/load-storage-images.ts";
import { getClientIpAddress } from "../_shared/client-ip.ts";
import {
  assertGuestAiGlobalSpendLimit,
  assertGuestSuggestFromPhotosRateLimit,
  assertSuggestFromPhotosRateLimit,
  verifyGuestVisitorToken,
} from "../_shared/moderation/rate-limit.ts";
import { logModerationCheck } from "../_shared/moderation/log-moderation-check.ts";
import {
  checkImageNudity,
  SightengineUnavailableError,
} from "../_shared/moderation/sightengine.ts";
import {
  runSuggestListingWithFallback,
  SuggestListingInferenceError,
  type SuggestListingWithFallbackResult,
} from "../_shared/moderation/run-suggest-listing.ts";
import { isEmailBlacklisted } from "../_shared/moderation/account-blacklist.ts";
import { verifyTurnstileToken } from "../_shared/moderation/turnstile.ts";

const SUGGEST_MAX_IMAGES = 2;
const SUGGEST_LOG_INTENT = "suggest_from_photos";
const SUGGEST_REQUEST_BUDGET_MS = 28_000;

type SightengineResponseEntry = {
  imageIndex: number;
  response?: unknown;
  error?: string;
};
const NSFW_IMAGE_REASON =
  "Fotografie porušuje podmínky webu (nevhodný obsah). Nahrajte jiné snímky.";
const SIGHTENGINE_UNAVAILABLE_MESSAGE =
  "Kontrola fotografií teď není dostupná. Zkuste to prosím za chvíli znovu.";
const ACCOUNT_BLACKLISTED_MESSAGE =
  "Účet je pozastaven kvůli porušení obchodních podmínek.";
const RATE_LIMIT_MESSAGE =
  "Dosáhli jste hodinového limitu AI předvyplnění (max. 10). Zkuste to v následující hodině, nebo vyplňte inzerát ručně.";
const GUEST_RATE_LIMIT_MESSAGE =
  "Dosáhli jste limitu AI předvyplnění. Zkuste to v následující hodině, nebo se přihlaste.";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function technicalErrorResponse(
  message: string,
  httpStatus = 503,
  errorCode?: string,
): Response {
  return jsonResponse({ error: "TECHNICAL_ERROR", message, errorCode }, httpStatus);
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    .test(value);
}

async function resolveAuthUser(
  req: Request,
): Promise<{ userId: string; email: string | null } | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const jwt = authHeader.slice(7).trim();
  if (!jwt) return null;

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const apikey =
    req.headers.get("apikey") ?? Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !apikey) {
    console.error("suggest resolveAuthUser: missing env");
    return null;
  }

  const supabase = createClient(supabaseUrl, apikey);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(jwt);

  if (error || !user?.id) return null;
  return { userId: user.id, email: user.email ?? null };
}

serve(async (req) => {
  const requestDeadlineAt = Date.now() + SUGGEST_REQUEST_BUDGET_MS;

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "METHOD_NOT_ALLOWED" }, 405);
  }

  try {
    const authUser = await resolveAuthUser(req);
    const body = await req.json().catch(() => null);

    let ownerPrefix: string;
    let logUserId: string | null = authUser?.userId ?? null;
    let logGuestVisitorId: string | null = null;

    if (!authUser) {
      const visitorId = String(body?.guestVisitorId ?? "").trim();
      if (!isUuid(visitorId)) {
        return jsonResponse(
          {
            error: "GUEST_VISITOR_REQUIRED",
            message: "Obnovte stránku a zkuste to znovu.",
          },
          400,
        );
      }
      const visitorToken = String(body?.guestVisitorToken ?? "").trim();
      if (!(await verifyGuestVisitorToken(visitorId, visitorToken))) {
        return jsonResponse(
          {
            error: "GUEST_VISITOR_REQUIRED",
            message: "Návštěvnická relace není platná. Obnovte stránku.",
          },
          403,
        );
      }

      const ipAddress = getClientIpAddress(req);
      const turnstileToken = String(body?.turnstileToken ?? "").trim();

      let guestLimit;
      try {
        guestLimit = await assertGuestSuggestFromPhotosRateLimit({
          ipAddress,
          visitorId,
          captchaVerified: false,
        });
      } catch (rateError) {
        if (rateError instanceof Error && rateError.message === "RATE_LIMIT") {
          return technicalErrorResponse(
            GUEST_RATE_LIMIT_MESSAGE,
            429,
            "RATE_LIMIT",
          );
        }
        return technicalErrorResponse(
          "AI předvyplnění teď není dostupné. Zkuste to za chvíli, nebo vyplňte inzerát ručně.",
          503,
          "RATE_LIMIT_UNAVAILABLE",
        );
      }

      if (guestLimit.requiresCaptcha) {
        const ok = await verifyTurnstileToken({
          token: turnstileToken,
          ipAddress,
        });
        if (!ok) {
          return jsonResponse(
            {
              error: "CAPTCHA_REQUIRED",
              message: "Potvrďte, že nejste robot, a zkuste to znovu.",
            },
            403,
          );
        }

        try {
          await assertGuestSuggestFromPhotosRateLimit({
            ipAddress,
            visitorId,
            captchaVerified: true,
          });
        } catch (rateError) {
          if (rateError instanceof Error && rateError.message === "RATE_LIMIT") {
            return technicalErrorResponse(
              GUEST_RATE_LIMIT_MESSAGE,
              429,
              "RATE_LIMIT",
            );
          }
          return technicalErrorResponse(
            "AI předvyplnění teď není dostupné. Zkuste to za chvíli, nebo vyplňte inzerát ručně.",
            503,
            "RATE_LIMIT_UNAVAILABLE",
          );
        }
      }

      try {
        await assertGuestAiGlobalSpendLimit();
      } catch (rateError) {
        if (
          rateError instanceof Error &&
          rateError.message === "RATE_LIMIT_GLOBAL"
        ) {
          return technicalErrorResponse(
            "AI je teď vytížená. Zkuste to za chvíli, nebo vyplňte inzerát ručně.",
            429,
            "RATE_LIMIT",
          );
        }
        return technicalErrorResponse(
          "AI předvyplnění teď není dostupné. Zkuste to za chvíli, nebo vyplňte inzerát ručně.",
          503,
          "RATE_LIMIT_UNAVAILABLE",
        );
      }

      ownerPrefix = `guest/${visitorId}`;
      logGuestVisitorId = visitorId;
    } else {
      const { userId, email: userEmail } = authUser;
      ownerPrefix = userId;
      logUserId = userId;

      if (userEmail && (await isEmailBlacklisted(userEmail))) {
        return jsonResponse(
          {
            status: "REJECTED",
            reason: ACCOUNT_BLACKLISTED_MESSAGE,
            accountBlocked: true,
            errorCode: "ACCOUNT_BLACKLISTED",
          },
          403,
        );
      }

      try {
        await assertSuggestFromPhotosRateLimit(userId);
      } catch (rateError) {
        if (rateError instanceof Error && rateError.message === "RATE_LIMIT") {
          return technicalErrorResponse(RATE_LIMIT_MESSAGE, 429, "RATE_LIMIT");
        }
        if (
          rateError instanceof Error &&
          rateError.message === "RATE_LIMIT_UNAVAILABLE"
        ) {
          return technicalErrorResponse(
            "AI předvyplnění teď není dostupné. Zkuste to za chvíli, nebo vyplňte inzerát ručně.",
            503,
            "RATE_LIMIT_UNAVAILABLE",
          );
        }
        throw rateError;
      }
    }

    const imageReferences: StorageImageReference[] = Array.isArray(
      body?.imageReferences,
    )
      ? body.imageReferences
          .map((item: unknown) => {
            const value = item as Partial<StorageImageReference>;
            return {
              bucket: String(value?.bucket ?? "").trim(),
              storagePath: String(value?.storagePath ?? "").trim(),
            };
          })
          .filter((item: StorageImageReference) => item.bucket && item.storagePath)
          .slice(0, SUGGEST_MAX_IMAGES)
      : [];

    if (imageReferences.length < 1) {
      return technicalErrorResponse(
        "Nahrajte alespoň jednu fotku pro AI předvyplnění.",
        400,
        "IMAGE_REQUIRED",
      );
    }

    let loadedImages;
    try {
      loadedImages = await loadModerationImagesFromStorage(
        imageReferences,
        ownerPrefix,
      );
    } catch (imageError) {
      const code =
        imageError instanceof Error ? imageError.message : "IMAGE_INVALID";
      if (
        code === "STORAGE_CONFIG_MISSING" ||
        code === "IMAGE_RENDITION_MISSING" ||
        code === "IMAGE_RENDITION_INVALID"
      ) {
        return technicalErrorResponse(
          "Fotky se teď nepodařilo připravit. Zkuste to znovu.",
          503,
          code,
        );
      }
      const reason =
        code === "IMAGE_REFERENCE_FORBIDDEN"
          ? "Fotka nemá platnou vazbu na přihlášený účet nebo návštěvnickou relaci."
          : "Neplatný formát fotky pro AI předvyplnění.";
      return jsonResponse(
        { status: "REJECTED", reason, errorCode: code },
        400,
      );
    }

    const {
      geminiImagesBase64,
      geminiImageMimeTypes,
      sightengineImagesBase64,
      sightengineImageMimeTypes,
    } = loadedImages;

    const sightengineResponses: SightengineResponseEntry[] = [];
    for (let index = 0; index < sightengineImagesBase64.length; index++) {
      try {
        const result = await checkImageNudity(
          sightengineImagesBase64[index]!,
          sightengineImageMimeTypes[index] ?? "image/webp",
        );
        sightengineResponses.push({
          imageIndex: index,
          response: result.response,
        });
        if (result.rejected) {
          await logModerationCheck({
            userId: logUserId,
            guestVisitorId: logGuestVisitorId,
            intent: SUGGEST_LOG_INTENT,
            status: "REJECTED",
            imageCount: sightengineImagesBase64.length,
            rejectionReason: NSFW_IMAGE_REASON,
            rejectedImageIndex: index,
            errorCode: "NSFW_IMAGE",
            rejectedTopicId: result.reason,
            sightengineResponses,
          });
          return jsonResponse(
            {
              status: "REJECTED",
              reason: NSFW_IMAGE_REASON,
              errorCode: "NSFW_IMAGE",
              rejectedImageIndex: index,
            },
            200,
          );
        }
      } catch (nsfwError) {
        if (nsfwError instanceof SightengineUnavailableError) {
          sightengineResponses.push({
            imageIndex: index,
            error: nsfwError.message,
          });
          await logModerationCheck({
            userId: logUserId,
            guestVisitorId: logGuestVisitorId,
            intent: SUGGEST_LOG_INTENT,
            status: "REJECTED",
            imageCount: sightengineImagesBase64.length,
            rejectionReason: SIGHTENGINE_UNAVAILABLE_MESSAGE,
            rejectedImageIndex: index,
            errorCode: "SIGHTENGINE_UNAVAILABLE",
            sightengineResponses,
          });
          return technicalErrorResponse(
            SIGHTENGINE_UNAVAILABLE_MESSAGE,
            503,
            "SIGHTENGINE_UNAVAILABLE",
          );
        }
        throw nsfwError;
      }
    }

    let inference: SuggestListingWithFallbackResult;
    try {
      inference = await runSuggestListingWithFallback({
        imagesBase64: geminiImagesBase64,
        imageMimeTypes: geminiImageMimeTypes,
        deadlineAtMs: requestDeadlineAt,
      });
    } catch (aiError) {
      const code =
        aiError instanceof Error ? aiError.message : "SUGGEST_PROVIDER_FAILED";
      let aiProvider: string | undefined;
      let aiModel: string | undefined;
      let usedFallback = false;

      if (aiError instanceof SuggestListingInferenceError) {
        aiProvider = aiError.primaryTarget.provider;
        aiModel = aiError.primaryTarget.model;
        usedFallback = aiError.fallbackTarget !== null;
        console.error(
          "suggest-listing inference failed:",
          JSON.stringify({
            errorCode: code,
            primary: {
              ...aiError.primaryTarget,
              errorCode:
                aiError.primaryError instanceof Error
                  ? aiError.primaryError.message
                  : "UNKNOWN_AI_ERROR",
            },
            fallback: aiError.fallbackTarget
              ? {
                  ...aiError.fallbackTarget,
                  errorCode:
                    aiError.fallbackError instanceof Error
                      ? aiError.fallbackError.message
                      : "UNKNOWN_AI_ERROR",
                }
              : null,
          }),
        );
      } else {
        console.error("suggest-listing inference failed:", code);
      }

      await logModerationCheck({
        userId: logUserId,
        guestVisitorId: logGuestVisitorId,
        intent: SUGGEST_LOG_INTENT,
        status: "REJECTED",
        imageCount: geminiImagesBase64.length,
        rejectionReason:
          "AI předvyplnění teď selhalo. Zkuste to znovu, nebo vyplňte inzerát ručně.",
        errorCode: code,
        sightengineResponses,
        aiProvider,
        aiModel,
        usedFallback,
      });
      return technicalErrorResponse(
        "AI předvyplnění teď selhalo. Zkuste to znovu, nebo vyplňte inzerát ručně.",
        503,
        code,
      );
    }

    const suggestion = inference.suggestion;

    console.log(
      "suggest-listing:",
      JSON.stringify({
        userId: logUserId,
        guestVisitorId: logGuestVisitorId,
        guest: logUserId === null,
        categoryType: suggestion.categoryType,
        subcategorySlug: suggestion.subcategorySlug,
        confidenceScore: suggestion.confidenceScore,
        aiProvider: inference.provider,
        aiModel: inference.model,
        usedFallback: inference.usedFallback,
        latencyMs: inference.latencyMs,
      }),
    );

    await logModerationCheck({
      userId: logUserId,
      guestVisitorId: logGuestVisitorId,
      intent: SUGGEST_LOG_INTENT,
      status: "APPROVED",
      categoryType: suggestion.categoryType,
      subcategorySlug: suggestion.subcategorySlug ?? undefined,
      imageCount: geminiImagesBase64.length,
      titlePreview: suggestion.title,
      sightengineResponses,
      aiProvider: inference.provider,
      aiModel: inference.model,
      usedFallback: inference.usedFallback,
    });

    return jsonResponse({
      status: "OK",
      title: suggestion.title,
      description: suggestion.description,
      categoryType: suggestion.categoryType,
      subcategorySlug: suggestion.subcategorySlug,
      confidenceScore: suggestion.confidenceScore,
    });
  } catch (error) {
    console.error("suggest-listing-from-photos:", error);
    return technicalErrorResponse(
      "AI předvyplnění teď není dostupné. Zkuste to za chvíli, nebo vyplňte inzerát ručně.",
      503,
      "UNEXPECTED",
    );
  }
});
