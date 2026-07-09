import {
  INQUIRY_RATE_LIMIT_PER_DAY,
  INQUIRY_RATE_LIMIT_PER_POST_PER_DAY,
} from "@/config/app";
import type { SupabaseClient } from "@supabase/supabase-js";

const WINDOW_MS = 24 * 60 * 60 * 1000;

function windowStartIso(): string {
  return new Date(Date.now() - WINDOW_MS).toISOString();
}

export type InquiryRateLimitResult =
  | { ok: true }
  | { ok: false; reason: "ip" | "post" | "db" };

export async function assertInquiryRateLimit(
  admin: SupabaseClient,
  ipAddress: string,
  postId: number,
): Promise<InquiryRateLimitResult> {
  const since = windowStartIso();

  const { count: ipCount, error: ipError } = await admin
    .from("inquiry_events")
    .select("*", { count: "exact", head: true })
    .eq("ip_address", ipAddress)
    .gte("created_at", since);

  if (ipError) {
    console.error("inquiry rate-limit ip count:", ipError);
    return { ok: false, reason: "db" };
  }

  if ((ipCount ?? 0) >= INQUIRY_RATE_LIMIT_PER_DAY) {
    return { ok: false, reason: "ip" };
  }

  const { count: postCount, error: postError } = await admin
    .from("inquiry_events")
    .select("*", { count: "exact", head: true })
    .eq("ip_address", ipAddress)
    .eq("post_id", postId)
    .gte("created_at", since);

  if (postError) {
    console.error("inquiry rate-limit post count:", postError);
    return { ok: false, reason: "db" };
  }

  if ((postCount ?? 0) >= INQUIRY_RATE_LIMIT_PER_POST_PER_DAY) {
    return { ok: false, reason: "post" };
  }

  return { ok: true };
}

export async function recordInquiryAttempt(
  admin: SupabaseClient,
  params: {
    postId: number;
    ipAddress: string;
    viewerUserId: string | null;
  },
): Promise<{ ok: true; id: string } | { ok: false }> {
  const { data, error } = await admin
    .from("inquiry_events")
    .insert({
      post_id: params.postId,
      ip_address: params.ipAddress,
      viewer_user_id: params.viewerUserId,
      delivered: false,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("inquiry event insert:", error);
    return { ok: false };
  }

  return { ok: true, id: data.id };
}

export async function markInquiryDelivered(
  admin: SupabaseClient,
  eventId: string,
): Promise<void> {
  const { error } = await admin
    .from("inquiry_events")
    .update({ delivered: true })
    .eq("id", eventId);

  if (error) {
    console.error("inquiry event delivered update:", error);
  }
}
