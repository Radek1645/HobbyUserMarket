/**
 * Staff-only lab: stejná suggest pipeline, dvě po sobě jdoucí volání modelu.
 *
 * Deploy:
 *   1. npm run sync:moderation
 *   2. supabase functions deploy compare-suggest-from-photos
 *
 * Nezasahuje do suggest-listing-from-photos ani moderate-listing.
 * Bez zápisu do moderation_checks / rate_limit tabulek.
 * Bez Sightengine — srovnává se klasifikace, ne NSFW gate.
 */
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";
import {
  loadModerationImagesFromStorage,
  type StorageImageReference,
} from "../_shared/moderation/load-storage-images.ts";
import {
  isSuggestAiProvider,
  runSuggestListingInference,
  type SuggestAiProvider,
  type SuggestListingInferenceResult,
} from "../_shared/moderation/run-suggest-listing.ts";

const COMPARE_MAX_IMAGES = 2;

type CompareArmInput = {
  label: string;
  provider: SuggestAiProvider;
  model: string;
};

type CompareArmOk = {
  ok: true;
  label: string;
  provider: SuggestAiProvider;
  model: string;
  latencyMs: number;
  title: string;
  description: string;
  categoryType: string;
  subcategorySlug: string | null;
  confidenceScore: number;
};

type CompareArmError = {
  ok: false;
  label: string;
  provider: SuggestAiProvider;
  model: string;
  errorCode: string;
};

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

function defaultArmA(): CompareArmInput {
  return {
    label: "A",
    provider: "gemini",
    model:
      Deno.env.get("COMPARE_SUGGEST_ARM_A_MODEL")?.trim() ||
      Deno.env.get("SUGGEST_LISTING_MODEL")?.trim() ||
      "gemini-3.5-flash-lite",
  };
}

function defaultArmB(): CompareArmInput {
  return {
    label: "B",
    provider: "openai",
    model:
      Deno.env.get("COMPARE_SUGGEST_ARM_B_MODEL")?.trim() ||
      "gpt-5.4-nano",
  };
}

function parseArmInput(
  raw: unknown,
  fallback: CompareArmInput,
): CompareArmInput | { error: string } {
  if (raw == null) return fallback;
  if (!raw || typeof raw !== "object") {
    return { error: "Neplatná specifikace modelu (arm)." };
  }
  const body = raw as Record<string, unknown>;
  const providerRaw = body.provider ?? fallback.provider;
  if (!isSuggestAiProvider(providerRaw)) {
    return { error: "Provider musí být gemini nebo openai." };
  }
  const model =
    typeof body.model === "string" && body.model.trim()
      ? body.model.trim()
      : fallback.model;
  if (!model) {
    return { error: "Model je povinný." };
  }
  const label =
    typeof body.label === "string" && body.label.trim()
      ? body.label.trim().slice(0, 40)
      : fallback.label;
  return { label, provider: providerRaw, model };
}

async function requireStaffUser(
  req: Request,
): Promise<{ userId: string } | Response> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonResponse(
      { error: "UNAUTHORIZED", message: "Vyžadováno přihlášení." },
      401,
    );
  }

  const jwt = authHeader.slice(7).trim();
  if (!jwt) {
    return jsonResponse(
      { error: "UNAUTHORIZED", message: "Vyžadováno přihlášení." },
      401,
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey =
    req.headers.get("apikey") ?? Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error("compare-suggest: missing Supabase env");
    return technicalErrorResponse(
      "Lab teď není dostupný (chybí konfigurace).",
      503,
      "STORAGE_CONFIG_MISSING",
    );
  }

  const userClient = createClient(supabaseUrl, anonKey);
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser(jwt);

  if (userError || !user?.id) {
    return jsonResponse(
      { error: "UNAUTHORIZED", message: "Sezení není platné." },
      401,
    );
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("compare-suggest profile:", profileError);
    return technicalErrorResponse(
      "Nepodařilo se ověřit oprávnění.",
      503,
      "PROFILE_LOOKUP_FAILED",
    );
  }

  const role = profile?.role;
  if (role !== "moderator" && role !== "admin") {
    return jsonResponse(
      {
        error: "FORBIDDEN",
        message: "Prefill lab je jen pro moderátory a adminy.",
      },
      403,
    );
  }

  return { userId: user.id };
}

function armResultFromInference(
  label: string,
  result: SuggestListingInferenceResult,
): CompareArmOk {
  return {
    ok: true,
    label,
    provider: result.provider,
    model: result.model,
    latencyMs: result.latencyMs,
    title: result.suggestion.title,
    description: result.suggestion.description,
    categoryType: result.suggestion.categoryType,
    subcategorySlug: result.suggestion.subcategorySlug,
    confidenceScore: result.suggestion.confidenceScore,
  };
}

function armErrorFromCatch(
  arm: CompareArmInput,
  error: unknown,
): CompareArmError {
  const errorCode =
    error instanceof Error && error.message
      ? error.message
      : "SUGGEST_INFERENCE_ERROR";
  console.error("compare-suggest arm:", arm.label, errorCode);
  return {
    ok: false,
    label: arm.label,
    provider: arm.provider,
    model: arm.model,
    errorCode,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "METHOD_NOT_ALLOWED" }, 405);
  }

  try {
    const staff = await requireStaffUser(req);
    if (staff instanceof Response) return staff;

    const body = await req.json().catch(() => null);
    const armAParsed = parseArmInput(body?.armA, defaultArmA());
    if ("error" in armAParsed) {
      return jsonResponse(
        { error: "INVALID_ARM", message: armAParsed.error },
        400,
      );
    }
    const armBParsed = parseArmInput(body?.armB, defaultArmB());
    if ("error" in armBParsed) {
      return jsonResponse(
        { error: "INVALID_ARM", message: armBParsed.error },
        400,
      );
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
          .filter(
            (item: StorageImageReference) =>
              item.bucket && item.storagePath,
          )
          .slice(0, COMPARE_MAX_IMAGES)
      : [];

    if (imageReferences.length < 1) {
      return technicalErrorResponse(
        "Nahrajte alespoň jednu fotku pro srovnání.",
        400,
        "IMAGE_REQUIRED",
      );
    }

    let loadedImages;
    try {
      loadedImages = await loadModerationImagesFromStorage(
        imageReferences,
        staff.userId,
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
          ? "Fotka nemá platnou vazbu na přihlášený účet."
          : "Neplatný formát fotky pro srovnání.";
      return jsonResponse(
        { status: "REJECTED", reason, errorCode: code },
        400,
      );
    }

    const { geminiImagesBase64, geminiImageMimeTypes } = loadedImages;

    console.log(
      "compare-suggest:",
      JSON.stringify({
        userId: staff.userId,
        imageCount: geminiImagesBase64.length,
        armA: {
          provider: armAParsed.provider,
          model: armAParsed.model,
        },
        armB: {
          provider: armBParsed.provider,
          model: armBParsed.model,
        },
      }),
    );

    // Sekvenčně: stejné fotky, stejný prompt/parse — liší se jen model.
    let armA: CompareArmOk | CompareArmError;
    try {
      const result = await runSuggestListingInference({
        provider: armAParsed.provider,
        model: armAParsed.model,
        imagesBase64: geminiImagesBase64,
        imageMimeTypes: geminiImageMimeTypes,
      });
      armA = armResultFromInference(armAParsed.label, result);
    } catch (error) {
      armA = armErrorFromCatch(armAParsed, error);
    }

    let armB: CompareArmOk | CompareArmError;
    try {
      const result = await runSuggestListingInference({
        provider: armBParsed.provider,
        model: armBParsed.model,
        imagesBase64: geminiImagesBase64,
        imageMimeTypes: geminiImageMimeTypes,
      });
      armB = armResultFromInference(armBParsed.label, result);
    } catch (error) {
      armB = armErrorFromCatch(armBParsed, error);
    }

    return jsonResponse({
      status: "OK",
      armA,
      armB,
    });
  } catch (error) {
    console.error("compare-suggest-from-photos:", error);
    return technicalErrorResponse(
      "Srovnání teď není dostupné. Zkuste to za chvíli.",
      503,
      "UNEXPECTED",
    );
  }
});
