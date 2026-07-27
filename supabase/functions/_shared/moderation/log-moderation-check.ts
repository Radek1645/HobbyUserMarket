import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

export type ModerationCheckStatus = "APPROVED" | "REJECTED" | "NEEDS_QUESTIONS";

export type ModerationCheckLog = {
  userId: string;
  intent?: string;
  status: ModerationCheckStatus;
  categoryType?: string;
  subcategorySlug?: string;
  imageCount?: number;
  rejectedTopicId?: string;
  rejectionReason?: string;
  rejectedImageIndex?: number;
  errorCode?: string;
  titlePreview?: string;
  /** Až 6 Sightengine odpovědí v jednom poli. */
  sightengineResponses?: unknown;
  /** AI telemetrie kategorií (058) — neautomatické vytváření. */
  categoryFit?: string;
  suggestedCategoryType?: string;
  suggestedSubcategorySlug?: string;
  categoryTaxonomyHint?: string;
  promptVersion?: string;
  aiProvider?: string;
  aiModel?: string;
  usedFallback?: boolean;
  policyHash?: string;
  inputFingerprint?: string;
  imageHashes?: string[];
};

function truncatePreview(text: string, max = 120): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

/** Append-only log; volající rozhodne, zda jeho selhání smí zablokovat approval. */
export async function logModerationCheck(
  entry: ModerationCheckLog,
): Promise<boolean> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    console.warn("log-moderation-check: missing Supabase env, skipping");
    return false;
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const { error } = await admin.from("moderation_checks").insert({
    user_id: entry.userId,
    intent: entry.intent?.trim() || null,
    status: entry.status,
    category_type: entry.categoryType?.trim() || null,
    subcategory_slug: entry.subcategorySlug?.trim() || null,
    image_count: entry.imageCount ?? 0,
    rejected_topic_id: entry.rejectedTopicId?.trim() || null,
    rejection_reason: entry.rejectionReason?.trim() || null,
    rejected_image_index: entry.rejectedImageIndex ?? null,
    error_code: entry.errorCode?.trim() || null,
    title_preview: entry.titlePreview
      ? truncatePreview(entry.titlePreview)
      : null,
    sightengine_responses: entry.sightengineResponses ?? null,
    category_fit: entry.categoryFit?.trim() || null,
    suggested_category_type: entry.suggestedCategoryType?.trim() || null,
    suggested_subcategory_slug: entry.suggestedSubcategorySlug?.trim() || null,
    category_taxonomy_hint: entry.categoryTaxonomyHint
      ? truncatePreview(entry.categoryTaxonomyHint, 120)
      : null,
    prompt_version: entry.promptVersion?.trim() || null,
    ai_provider: entry.aiProvider?.trim() || null,
    ai_model: entry.aiModel?.trim() || null,
    used_fallback: entry.usedFallback ?? null,
    policy_hash: entry.policyHash?.trim() || null,
    input_fingerprint: entry.inputFingerprint?.trim() || null,
    image_hashes: entry.imageHashes ?? [],
  });

  if (error) {
    console.error("log-moderation-check:", error);
    return false;
  }
  return true;
}
