/**
 * Edge Function: AI moderace inzerátu (PRD §5.4).
 *
 * Deploy (správné pořadí):
 *   1. npm run sync:moderation   ← nejdřív vygeneruje _shared/category-prompts.ts
 *   2. supabase secrets set GEMINI_API_KEY=...
 *   3. supabase functions deploy moderate-listing   ← pak teprve deploy
 */
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";
import { buildModerationSystemPrompt } from "../_shared/moderation/build-prompt.ts";
import {
  buildModerationUserPrompt,
  type ModerationRequestBody,
} from "../_shared/moderation/build-user-prompt.ts";
import {
  callGeminiModeration,
  resolveGeminiModerationModel,
} from "../_shared/moderation/gemini.ts";
import {
  callOpenAiModeration,
  resolveOpenAiModerationModel,
} from "../_shared/moderation/openai.ts";
import {
  filterRedundantPriceQuestions,
  normalizeModerationResult,
  parseModerationResponse,
} from "../_shared/moderation/parse-response.ts";
import { ensureRequiredCategoryQuestions } from "../_shared/moderation/required-category-questions.ts";
import {
  applyPostModerationSafetyChecks,
  containsPromptInjection,
  PROMPT_INJECTION_REJECTION_REASON,
} from "../_shared/moderation/prompt-injection-guard.ts";
import { findProhibitedKeyword, checkHardHitText } from "../_shared/moderation/prohibited-scan.ts";
import { assertAiModerationRateLimit } from "../_shared/moderation/rate-limit.ts";
import {
  assertModerationImagesWithinLimits,
  computeModerationImageHashes,
  decodeBase64Bytes,
  detectImageMimeType,
} from "../_shared/moderation/assert-image-limits.ts";
import { issueModerationApproval } from "../_shared/moderation/issue-approval.ts";
import {
  computeListingContentFingerprint,
  computeTextSha256,
} from "../_shared/moderation/content-fingerprint.ts";
import { logModerationCheck } from "../_shared/moderation/log-moderation-check.ts";
import type { ModerationResult } from "../_shared/moderation/parse-response.ts";
import {
  assertValidCategoryPair,
  resolveCategoryAiPrompt,
} from "../_shared/moderation/category-prompts.ts";
import {
  checkImageNudity,
  SightengineUnavailableError,
} from "../_shared/moderation/sightengine.ts";
import {
  incrementHardRejectAndMaybeApplyHardStop,
  recordHardRejectEvidence,
  uploadNsfwEvidenceImage,
} from "../_shared/moderation/hard-reject-evidence.ts";
import { isEmailBlacklisted } from "../_shared/moderation/account-blacklist.ts";

/** CZ copy — drž sync s src/config/moderation/messages.ts (sync skript nekopíruje). */
const HARD_HIT_TEXT_REASON =
  "Text inzerátu porušuje podmínky webu. Upravte název nebo popis. Pokud s rozhodnutím nesouhlasíte, kontaktujte nás.";
const NSFW_IMAGE_REASON =
  "Fotografie porušuje podmínky webu (nevhodný obsah). Nahrajte jiné snímky. Pokud s rozhodnutím nesouhlasíte, kontaktujte nás.";
const SIGHTENGINE_UNAVAILABLE_MESSAGE =
  "Kontrola fotografií teď není dostupná. Zkuste to prosím za chvíli znovu.";
const ACCOUNT_BLACKLISTED_MESSAGE =
  "Účet je pozastaven kvůli porušení obchodních podmínek.";
const MODERATION_PROMPT_VERSION = "moderation-v1.8-2026-07-27";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const moderationSystemPromptFull = buildModerationSystemPrompt();
const moderationSystemPromptGemini = buildModerationSystemPrompt({
  geminiSafe: true,
});

type ModerationLogContext = {
  intent?: string;
  title?: string;
  categoryType?: string;
  subcategorySlug?: string;
  imageCount?: number;
  /** Až 6 Sightengine odpovědí — ukládá se do moderation_checks. */
  sightengineResponses?: unknown;
  promptVersion?: string;
  aiProvider?: "gemini" | "openai";
  aiModel?: string;
  usedFallback?: boolean;
  policyHash?: string;
  inputFingerprint?: string;
  imageHashes?: string[];
};

type SightengineResponseEntry = {
  imageIndex: number;
  response?: unknown;
  error?: string;
};

function parseModerationPriceAmount(value: unknown): number | undefined {
  if (typeof value === "number" && !Number.isNaN(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.replace(/\s/g, ""));
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return undefined;
}

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
  // DŮLEŽITÉ: Nevracíme `status: REJECTED`, aby klient nezobrazil zamítnutí
  // při technickém selhání AI (P8/U1).
  return jsonResponse({ error: "TECHNICAL_ERROR", message, errorCode }, httpStatus);
}

type ModerationResponseBody = ModerationResult & {
  approvalToken?: string | null;
  errorCode?: string;
  accountBlocked?: boolean;
};

function logModerationResult(
  userId: string,
  logCtx: ModerationLogContext,
  body: ModerationResponseBody,
  errorCode?: string,
): Promise<boolean> {
  return logModerationCheck({
    userId,
    intent: logCtx.intent,
    status: body.status,
    categoryType: logCtx.categoryType,
    subcategorySlug: logCtx.subcategorySlug,
    imageCount: logCtx.imageCount,
    rejectedTopicId: body.rejectedTopicId,
    rejectionReason: body.reason,
    rejectedImageIndex: body.rejectedImageIndex,
    errorCode,
    titlePreview: logCtx.title,
    sightengineResponses: logCtx.sightengineResponses,
    categoryFit: body.categorySuggestion?.fit,
    suggestedCategoryType: body.categorySuggestion?.categoryType,
    suggestedSubcategorySlug: body.categorySuggestion?.subcategorySlug,
    categoryTaxonomyHint: body.categorySuggestion?.hint,
    promptVersion: logCtx.promptVersion,
    aiProvider: logCtx.aiProvider,
    aiModel: logCtx.aiModel,
    usedFallback: logCtx.usedFallback,
    policyHash: logCtx.policyHash,
    inputFingerprint: logCtx.inputFingerprint,
    imageHashes: logCtx.imageHashes,
  });
}

async function respondWithLog(
  userId: string,
  logCtx: ModerationLogContext,
  body: ModerationResponseBody,
  options?: {
    errorCode?: string;
    httpStatus?: number;
    alreadyLogged?: boolean;
  },
): Promise<Response> {
  const errorCode = options?.errorCode ?? body.errorCode;
  if (!options?.alreadyLogged) {
    await logModerationResult(userId, logCtx, body, errorCode);
  }

  // Telemetrie kategorií zůstává jen v DB — klientovi neposíláme.
  const rest = { ...body };
  delete rest.errorCode;
  delete rest.categorySuggestion;
  return jsonResponse(
    errorCode ? { ...rest, errorCode } : rest,
    options?.httpStatus ?? 200,
  );
}

function logRejectedFromContext(
  userId: string,
  logCtx: ModerationLogContext,
  rejectionReason: string,
  errorCode?: string,
): Promise<boolean> {
  return logModerationCheck({
    userId,
    intent: logCtx.intent,
    status: "REJECTED",
    categoryType: logCtx.categoryType,
    subcategorySlug: logCtx.subcategorySlug,
    imageCount: logCtx.imageCount,
    rejectionReason,
    errorCode,
    titlePreview: logCtx.title,
    sightengineResponses: logCtx.sightengineResponses,
    promptVersion: logCtx.promptVersion,
    aiProvider: logCtx.aiProvider,
    aiModel: logCtx.aiModel,
    usedFallback: logCtx.usedFallback,
    policyHash: logCtx.policyHash,
    inputFingerprint: logCtx.inputFingerprint,
    imageHashes: logCtx.imageHashes,
  });
}

async function resolveAuthUser(
  req: Request,
): Promise<{ userId: string; email: string | null } | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const jwt = authHeader.slice(7).trim();
  if (!jwt) return null;

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  // invoke() posílá apikey v hlavičce — spolehlivější než env při custom secrets.
  const apikey =
    req.headers.get("apikey") ?? Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !apikey) {
    console.error(
      "resolveAuthUser: missing env",
      JSON.stringify({
        hasUrl: Boolean(supabaseUrl),
        hasApikey: Boolean(apikey),
      }),
    );
    return null;
  }

  const supabase = createClient(supabaseUrl, apikey);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(jwt);

  if (error) {
    console.error("auth.getUser:", error);
    return null;
  }

  if (!user?.id) return null;
  return { userId: user.id, email: user.email ?? null };
}

function logModerationAiProvider(
  provider: "gemini" | "openai",
  model: string,
  fallback: boolean,
): void {
  console.log(
    "moderation-ai:",
    JSON.stringify({ provider, model, fallback }),
  );
}

async function callModerationAi(params: {
  userPrompt: string;
  imagesBase64: string[];
  imageMimeTypes: string[];
}): Promise<{
  rawResponse: string;
  provider: "gemini" | "openai";
  model: string;
  fallback: boolean;
  policyHash: string;
}> {
  const hasGemini = Boolean(Deno.env.get("GEMINI_API_KEY"));
  const hasOpenAi = Boolean(Deno.env.get("OPENAI_API_KEY"));

  if (!hasGemini && !hasOpenAi) {
    throw new Error("AI_KEYS_MISSING");
  }

  if (hasGemini) {
    try {
      const model = resolveGeminiModerationModel();
      logModerationAiProvider(
        "gemini",
        model,
        false,
      );
      const rawResponse = await callGeminiModeration({
        ...params,
        systemPrompt: moderationSystemPromptGemini,
      });
      return {
        rawResponse,
        provider: "gemini",
        model,
        fallback: false,
        policyHash: await computeTextSha256(moderationSystemPromptGemini),
      };
    } catch (geminiError) {
      console.error("Gemini failed:", geminiError);
      if (hasOpenAi) {
        const model = resolveOpenAiModerationModel();
        logModerationAiProvider(
          "openai",
          model,
          true,
        );
        const rawResponse = await callOpenAiModeration({
          ...params,
          systemPrompt: moderationSystemPromptFull,
        });
        return {
          rawResponse,
          provider: "openai",
          model,
          fallback: true,
          policyHash: await computeTextSha256(moderationSystemPromptFull),
        };
      }
      throw geminiError;
    }
  }

  const model = resolveOpenAiModerationModel();
  logModerationAiProvider("openai", model, false);
  const rawResponse = await callOpenAiModeration({
    ...params,
    systemPrompt: moderationSystemPromptFull,
  });
  return {
    rawResponse,
    provider: "openai",
    model,
    fallback: false,
    policyHash: await computeTextSha256(moderationSystemPromptFull),
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ status: "REJECTED", reason: "Metoda není povolena." }, 405);
  }

  let userId: string | null = null;
  let userEmail: string | null = null;
  const logCtx: ModerationLogContext = {};

  try {
    const authUser = await resolveAuthUser(req);
    userId = authUser?.userId ?? null;
    userEmail = authUser?.email ?? null;
    if (!userId) {
      return jsonResponse(
        {
          error: "AUTH_REQUIRED",
          message: "Pro AI kontrolu se přihlaste.",
        },
        401,
      );
    }

    if (userEmail && (await isEmailBlacklisted(userEmail))) {
      await logModerationCheck({
        userId,
        status: "REJECTED",
        rejectionReason: ACCOUNT_BLACKLISTED_MESSAGE,
        errorCode: "ACCOUNT_BLACKLISTED",
      });
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
      await assertAiModerationRateLimit(userId);
    } catch (rateError) {
      if (rateError instanceof Error && rateError.message === "RATE_LIMIT") {
        const reason =
          "Dosáhli jste hodinového limitu AI kontrol (max. 20). Další kontrolu bude možné spustit v následující hodině.";
        await logModerationCheck({
          userId,
          status: "REJECTED",
          rejectionReason: reason,
          errorCode: "RATE_LIMIT",
        });
        // P8: rate limit ≠ obsahové zamítnutí — klient zobrazí technickou chybu.
        return technicalErrorResponse(reason, 429, "RATE_LIMIT");
      }
      if (
        rateError instanceof Error &&
        rateError.message === "RATE_LIMIT_UNAVAILABLE"
      ) {
        const reason =
          "AI kontrola teď není dostupná. Zkuste to prosím za chvíli znovu.";
        await logModerationCheck({
          userId,
          status: "REJECTED",
          rejectionReason: reason,
          errorCode: "RATE_LIMIT_UNAVAILABLE",
        });
        return technicalErrorResponse(reason, 503, "RATE_LIMIT_UNAVAILABLE");
      }
      throw rateError;
    }

    const body = (await req.json()) as ModerationRequestBody;
    const title = String(body?.title ?? "").trim();
    const description = String(body?.description ?? "").trim();
    logCtx.intent = String(body?.intent ?? "").trim() || undefined;
    logCtx.title = title;
    const imagesBase64 = Array.isArray(body?.imagesBase64)
      ? body.imagesBase64
          .map((item: unknown) => String(item ?? "").trim())
          .filter(Boolean)
          .slice(0, 6)
      : [];
    const mainImageIndex =
      typeof body?.mainImageIndex === "number" ? body.mainImageIndex : 0;
    logCtx.imageCount = imagesBase64.length;
    try {
      assertModerationImagesWithinLimits(imagesBase64);
    } catch (imageError) {
      const code =
        imageError instanceof Error ? imageError.message : "IMAGE_INVALID";
      const reason =
        code === "IMAGE_TOO_LARGE" || code === "IMAGES_TOTAL_TOO_LARGE"
          ? "Fotky pro AI kontrolu jsou příliš velké. Zmenšete je a zkuste to znovu."
          : "Neplatný formát fotky pro AI kontrolu.";
      return respondWithLog(
        userId,
        logCtx,
        { status: "REJECTED", reason },
        { errorCode: code, httpStatus: 400 },
      );
    }

    const imageMimeTypes = imagesBase64.map((encoded) => {
      const mimeType = detectImageMimeType(decodeBase64Bytes(encoded));
      if (!mimeType) {
        throw new Error("IMAGE_INVALID");
      }
      return mimeType;
    });
    const imageHashes = await computeModerationImageHashes(imagesBase64);

    if (!title || !description) {
      const reason = "Chybí název nebo popis inzerátu.";
      return respondWithLog(
        userId,
        logCtx,
        { status: "REJECTED", reason },
        { errorCode: "VALIDATION_MISSING_TEXT", httpStatus: 400 },
      );
    }

    if (containsPromptInjection(`${title}\n${description}`)) {
      return respondWithLog(
        userId,
        logCtx,
        { status: "REJECTED", reason: PROMPT_INJECTION_REJECTION_REASON },
        { errorCode: "PROMPT_INJECTION", httpStatus: 400 },
      );
    }

    const categoryType = String(body?.categoryType ?? "").trim();
    const subcategorySlug = String(body?.subcategorySlug ?? "").trim();
    logCtx.categoryType = categoryType || undefined;
    logCtx.subcategorySlug = subcategorySlug || undefined;

    if (!categoryType || !subcategorySlug) {
      const reason = "Chybí kategorie inzerátu.";
      return respondWithLog(
        userId,
        logCtx,
        { status: "REJECTED", reason },
        { errorCode: "VALIDATION_MISSING_CATEGORY", httpStatus: 400 },
      );
    }

    try {
      assertValidCategoryPair(categoryType, subcategorySlug);
    } catch {
      const reason = "Neplatná kategorie inzerátu.";
      return respondWithLog(
        userId,
        logCtx,
        { status: "REJECTED", reason },
        { errorCode: "VALIDATION_INVALID_CATEGORY", httpStatus: 400 },
      );
    }

    // --- Pre-Gemini gate: hard-hit text + NSFW fotky ---
    const hardHit = checkHardHitText(`${title}\n${description}`);
    if (hardHit.rejected) {
      await recordHardRejectEvidence({
        userId,
        kind: "hard_hit_text",
        matchedCategory: hardHit.matchedCategory,
        matchedTerm: hardHit.matchedTerm,
        reason: HARD_HIT_TEXT_REASON,
        titleSnippet: title,
      });
      const accountBlocked = await incrementHardRejectAndMaybeApplyHardStop(
        userId,
        userEmail,
      );
      return respondWithLog(
        userId,
        logCtx,
        {
          status: "REJECTED",
          reason: HARD_HIT_TEXT_REASON,
          rejectedTopicId: hardHit.matchedCategory,
          accountBlocked: accountBlocked || undefined,
        },
        { errorCode: "HARD_HIT_TEXT" },
      );
    }

    if (imagesBase64.length > 0) {
      const sightengineResponses: SightengineResponseEntry[] = [];
      for (let imageIndex = 0; imageIndex < imagesBase64.length; imageIndex++) {
        const imageBase64 = imagesBase64[imageIndex];
        try {
          const nudity = await checkImageNudity(imageBase64);
          sightengineResponses.push({
            imageIndex,
            response: nudity.response,
          });
          logCtx.sightengineResponses = sightengineResponses;

          if (nudity.rejected) {
            const storagePath = await uploadNsfwEvidenceImage(
              userId,
              imageBase64,
              imageIndex,
              imageMimeTypes[imageIndex],
            );
            await recordHardRejectEvidence({
              userId,
              kind: "nsfw_image",
              reason: nudity.reason,
              titleSnippet: title,
              storagePath: storagePath ?? undefined,
              imageIndex,
              sightengineResponses,
            });
            const accountBlocked = await incrementHardRejectAndMaybeApplyHardStop(
              userId,
              userEmail,
            );
            return respondWithLog(
              userId,
              logCtx,
              {
                status: "REJECTED",
                reason: NSFW_IMAGE_REASON,
                rejectedImageIndex: imageIndex,
                accountBlocked: accountBlocked || undefined,
              },
              { errorCode: "NSFW_IMAGE" },
            );
          }
        } catch (nudityError) {
          if (nudityError instanceof SightengineUnavailableError) {
            sightengineResponses.push({
              imageIndex,
              error: nudityError.message,
            });
            logCtx.sightengineResponses = sightengineResponses;
            await recordHardRejectEvidence({
              userId,
              kind: "sightengine_unavailable",
              reason: nudityError.message,
              titleSnippet: title,
              imageIndex,
              sightengineResponses,
            });
            await logRejectedFromContext(
              userId,
              logCtx,
              SIGHTENGINE_UNAVAILABLE_MESSAGE,
              "SIGHTENGINE_UNAVAILABLE",
            );
            return technicalErrorResponse(
              SIGHTENGINE_UNAVAILABLE_MESSAGE,
              503,
              "SIGHTENGINE_UNAVAILABLE",
            );
          }
          throw nudityError;
        }
      }
      logCtx.sightengineResponses = sightengineResponses;
    }

    const categoryAiPrompt = resolveCategoryAiPrompt(
      categoryType,
      subcategorySlug,
    );

    const priceType = String(body?.priceType ?? "").trim() || undefined;
    const priceTypeLabel =
      String(body?.priceTypeLabel ?? "").trim() || undefined;
    const priceAmount = parseModerationPriceAmount(body?.priceAmount);
    const inputFingerprint = await computeListingContentFingerprint({
      title,
      description,
      categoryType,
      subcategorySlug,
      conditionLabel: String(body?.conditionLabel ?? ""),
      priceType: priceType ?? "",
      priceAmount: priceAmount ?? null,
      exchangeFor:
        priceType === "exchange"
          ? String(body?.exchangeFor ?? "").trim()
          : "",
      locationText: String(body?.locationText ?? "").trim(),
      latitude: typeof body?.latitude === "number" ? body.latitude : null,
      longitude: typeof body?.longitude === "number" ? body.longitude : null,
      eventDate: String(body?.eventDate ?? "").trim() || null,
      listingDurationDays:
        typeof body?.listingDurationDays === "number"
          ? body.listingDurationDays
          : 0,
      showContactEmail: body?.showContactEmail === true,
      showContactPhone: body?.showContactPhone === true,
      contactPhone:
        body?.showContactPhone === true
          ? String(body?.contactPhone ?? "").trim().replace(/\s+/g, " ")
          : "",
      jobCvRequired: body?.jobCvRequired === true,
    });
    logCtx.promptVersion = MODERATION_PROMPT_VERSION;
    logCtx.inputFingerprint = inputFingerprint;
    logCtx.imageHashes = imageHashes;

    const userPrompt = buildModerationUserPrompt(
      {
        intent: body.intent,
        title,
        description,
        categoryType,
        subcategorySlug,
        conditionLabel: String(body?.conditionLabel ?? "").trim() || undefined,
        conditionLabelText:
          String(body?.conditionLabelText ?? "").trim() || undefined,
        conditionFieldLabel:
          String(body?.conditionFieldLabel ?? "").trim() || undefined,
        eventDate: String(body?.eventDate ?? "").trim() || undefined,
        priceType,
        priceTypeLabel,
        priceAmount,
        locationText: String(body?.locationText ?? "").trim() || undefined,
        mainImageIndex,
        imagesBase64,
      },
      categoryAiPrompt,
    );

    const aiResult = await callModerationAi({
      userPrompt,
      imagesBase64,
      imageMimeTypes,
    });
    logCtx.aiProvider = aiResult.provider;
    logCtx.aiModel = aiResult.model;
    logCtx.usedFallback = aiResult.fallback;
    logCtx.policyHash = aiResult.policyHash;

    const parsed = parseModerationResponse(
      aiResult.rawResponse,
      imagesBase64.length,
    );
    const withoutPriceQuestions = filterRedundantPriceQuestions(
      parsed,
      priceType,
      priceAmount,
    );
    const normalized = normalizeModerationResult(
      withoutPriceQuestions,
      title,
      description,
      priceType,
      priceAmount,
      categoryType,
    );
    const withRequiredQuestions = ensureRequiredCategoryQuestions(normalized, {
      categoryType,
      subcategorySlug,
      sourceTitle: title,
      sourceDescription: description,
    });
    const result = applyPostModerationSafetyChecks(
      withRequiredQuestions,
      { title, description },
      findProhibitedKeyword,
    );

    // NEEDS_QUESTIONS znamená bezpečný, ale kvalitativně neúplný inzerát.
    // Otázky jsou podle UI nepovinné, proto finální bezpečnostní kontrola smí
    // vydat token pro oba nezamítnuté statusy. Token stále váže přesný text.
    if (result.status !== "REJECTED" && body.issueApproval === true) {
      const auditLogged = await logModerationResult(
        userId,
        logCtx,
        result,
      );
      if (!auditLogged) {
        return technicalErrorResponse(
          "Výsledek AI kontroly se nepodařilo bezpečně zaznamenat. Zkuste to prosím znovu.",
          503,
          "MODERATION_AUDIT_FAILED",
        );
      }

      const approvalToken = await issueModerationApproval(
        userId,
        imagesBase64.length,
        inputFingerprint,
        imageHashes,
      );
      if (!approvalToken) {
        return technicalErrorResponse(
          "AI kontrola nevydala potvrzení pro publikaci. Zkuste to prosím znovu.",
          503,
          "APPROVAL_ISSUE_FAILED",
        );
      }
      return respondWithLog(
        userId,
        logCtx,
        { ...result, approvalToken },
        { alreadyLogged: true },
      );
    }

    return respondWithLog(userId, logCtx, result);
  } catch (error) {
    console.error("moderate-listing:", error);

    if (error instanceof Error) {
      // Vstup zablokoval bezpečnostní filtr Google — obsahový problém,
      // ne výpadek. Vracíme normální zamítnutí.
      if (error.message.startsWith("GEMINI_BLOCKED_")) {
        const reason =
          "Text nebo fotky inzerátu zablokoval bezpečnostní filtr. Zkuste jiné fotografie nebo upravte popis.";
        if (userId) {
          await logRejectedFromContext(
            userId,
            logCtx,
            reason,
            error.message,
          );
        }
        return jsonResponse({ status: "REJECTED", reason });
      }

      if (error.message === "AI_KEYS_MISSING") {
        if (userId) {
          await logRejectedFromContext(
            userId,
            logCtx,
            "AI kontrola teď není dostupná. Zkuste to prosím později.",
            "AI_KEYS_MISSING",
          );
        }
        return technicalErrorResponse(
          "AI kontrola teď není dostupná. Zkuste to prosím později.",
          503,
          "AI_KEYS_MISSING",
        );
      }

      if (error.message === "GEMINI_HTTP_429") {
        const reason =
          "AI kontrola je teď dočasně přetížená. Zkuste to prosím za chvíli znovu.";
        if (userId) {
          await logRejectedFromContext(
            userId,
            logCtx,
            reason,
            error.message,
          );
        }
        return technicalErrorResponse(reason, 503, "GEMINI_HTTP_429");
      }

      if (
        error.message.startsWith("GEMINI_") ||
        error.message.startsWith("OPENAI_") ||
        error.message.includes("validní JSON")
      ) {
        const reason =
          "AI kontrola teď nefunguje. Zkuste to prosím za chvíli znovu.";
        if (userId) {
          await logRejectedFromContext(
            userId,
            logCtx,
            reason,
            error.message.slice(0, 120),
          );
        }
        return technicalErrorResponse(reason, 503, "AI_TECHNICAL_FAILURE");
      }
    }

    // P8/U1: neočekávaná chyba nesmí vypadat jako zamítnutí obsahu.
    return technicalErrorResponse(
      "AI kontrola teď nefunguje. Zkuste to prosím za chvíli znovu.",
      503,
      "UNEXPECTED_ERROR",
    );
  }
});
