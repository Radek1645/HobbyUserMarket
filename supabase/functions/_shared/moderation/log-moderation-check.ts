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
};

function truncatePreview(text: string, max = 120): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

/** Append-only log — selhání zápisu neblokuje moderaci. */
export async function logModerationCheck(
  entry: ModerationCheckLog,
): Promise<void> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    console.warn("log-moderation-check: missing Supabase env, skipping");
    return;
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
  });

  if (error) {
    console.error("log-moderation-check:", error);
  }
}
