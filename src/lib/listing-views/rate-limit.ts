import { LISTING_VIEW_RATE_LIMIT_PER_IP_PER_DAY } from "@/config/app";
import type { SupabaseClient } from "@supabase/supabase-js";

const WINDOW_MS = 24 * 60 * 60 * 1000;

/** Max. zápisů zobrazení z jedné IP (hash) za 24 h. */
export async function assertListingViewRateLimit(
  admin: SupabaseClient,
  ipHash: string,
): Promise<{ ok: true } | { ok: false }> {
  const since = new Date(Date.now() - WINDOW_MS).toISOString();

  const { count, error } = await admin
    .from("listing_views")
    .select("*", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("viewed_at", since);

  if (error) {
    console.error("listing-view rate-limit:", error);
    return { ok: false };
  }

  if ((count ?? 0) >= LISTING_VIEW_RATE_LIMIT_PER_IP_PER_DAY) {
    return { ok: false };
  }

  return { ok: true };
}
