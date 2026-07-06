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
import { callGeminiModeration } from "../_shared/moderation/gemini.ts";
import { callOpenAiModeration } from "../_shared/moderation/openai.ts";
import {
  filterRedundantPriceQuestions,
  normalizeModerationResult,
  parseModerationResponse,
} from "../_shared/moderation/parse-response.ts";
import { assertAiModerationRateLimit } from "../_shared/moderation/rate-limit.ts";
import {
  assertValidCategoryPair,
  resolveCategoryAiPrompt,
} from "../_shared/moderation/category-prompts.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const moderationSystemPrompt = buildModerationSystemPrompt();

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function resolveUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !anonKey) return null;

  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error("auth.getUser:", error);
    return null;
  }

  return user?.id ?? null;
}

async function callModerationAi(params: {
  systemPrompt: string;
  userPrompt: string;
  imagesBase64: string[];
}): Promise<string> {
  const hasGemini = Boolean(Deno.env.get("GEMINI_API_KEY"));
  const hasOpenAi = Boolean(Deno.env.get("OPENAI_API_KEY"));

  if (!hasGemini && !hasOpenAi) {
    throw new Error("AI_KEYS_MISSING");
  }

  if (hasGemini) {
    try {
      return await callGeminiModeration(params);
    } catch (geminiError) {
      console.error("Gemini failed:", geminiError);
      if (hasOpenAi) {
        return await callOpenAiModeration(params);
      }
      throw geminiError;
    }
  }

  return await callOpenAiModeration(params);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ status: "REJECTED", reason: "Metoda není povolena." }, 405);
  }

  try {
    const userId = await resolveUserId(req);
    if (!userId) {
      return jsonResponse(
        { status: "REJECTED", reason: "Pro AI kontrolu se přihlaste." },
        401,
      );
    }

    try {
      await assertAiModerationRateLimit(userId);
    } catch (rateError) {
      if (rateError instanceof Error && rateError.message === "RATE_LIMIT") {
        return jsonResponse(
          {
            status: "REJECTED",
            reason:
              "Příliš mnoho AI kontrol za hodinu. Zkuste to prosím znovu později, nebo upravte inzerát bez další kontroly.",
          },
          429,
        );
      }
      throw rateError;
    }

    const body = (await req.json()) as ModerationRequestBody;
    const title = String(body?.title ?? "").trim();
    const description = String(body?.description ?? "").trim();
    const imagesBase64 = Array.isArray(body?.imagesBase64)
      ? body.imagesBase64
          .map((item: unknown) => String(item ?? "").trim())
          .filter(Boolean)
          .slice(0, 6)
      : [];
    const mainImageIndex =
      typeof body?.mainImageIndex === "number" ? body.mainImageIndex : 0;

    if (!title || !description) {
      return jsonResponse({
        status: "REJECTED",
        reason: "Chybí název nebo popis inzerátu.",
      }, 400);
    }

    const categoryType = String(body?.categoryType ?? "").trim();
    const subcategorySlug = String(body?.subcategorySlug ?? "").trim();

    if (!categoryType || !subcategorySlug) {
      return jsonResponse(
        {
          status: "REJECTED",
          reason: "Chybí kategorie inzerátu.",
        },
        400,
      );
    }

    try {
      assertValidCategoryPair(categoryType, subcategorySlug);
    } catch {
      return jsonResponse(
        {
          status: "REJECTED",
          reason: "Neplatná kategorie inzerátu.",
        },
        400,
      );
    }

    const categoryAiPrompt = resolveCategoryAiPrompt(
      categoryType,
      subcategorySlug,
    );

    const priceType = String(body?.priceType ?? "").trim() || undefined;
    const priceTypeLabel =
      String(body?.priceTypeLabel ?? "").trim() || undefined;
    const priceAmount =
      typeof body?.priceAmount === "number" &&
      !Number.isNaN(body.priceAmount)
        ? body.priceAmount
        : undefined;

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
        mainImageIndex,
        imagesBase64,
      },
      categoryAiPrompt,
    );

    const rawAiResponse = await callModerationAi({
      systemPrompt: moderationSystemPrompt,
      userPrompt,
      imagesBase64,
    });

    const parsed = parseModerationResponse(rawAiResponse);
    const withoutPriceQuestions = filterRedundantPriceQuestions(
      parsed,
      priceType,
      priceAmount,
    );
    const result = normalizeModerationResult(
      withoutPriceQuestions,
      title,
      description,
    );

    return jsonResponse(result);
  } catch (error) {
    console.error("moderate-listing:", error);

    if (error instanceof Error) {
      if (error.message === "AI_KEYS_MISSING") {
        return jsonResponse({
          status: "REJECTED",
          reason:
            "AI moderace není nakonfigurovaná na serveru. Kontaktuj správce platformy.",
        });
      }

      if (error.message === "GEMINI_HTTP_429") {
        return jsonResponse({
          status: "REJECTED",
          reason:
            "Limit AI dotazů u Google je dočasně vyčerpaný. Zkuste to prosím za minutu znovu.",
        });
      }

      if (
        error.message.startsWith("GEMINI_") ||
        error.message.startsWith("OPENAI_") ||
        error.message.includes("validní JSON")
      ) {
        return jsonResponse({
          status: "REJECTED",
          reason:
            "AI kontrola teď nefunguje. Zkuste to prosím za chvíli znovu.",
        });
      }
    }

    return jsonResponse(
      {
        status: "REJECTED",
        reason: "Neplatný požadavek na moderaci.",
      },
      400,
    );
  }
});
