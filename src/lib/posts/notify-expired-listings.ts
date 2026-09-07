import { LISTING_EXPIRY_NOTICE_BATCH_LIMIT } from "@/config/listing-expiry";
import { notifyListingExpired } from "@/lib/email/notify-listing-expired";
import { resolveOwnerEmail } from "@/lib/inquiry/resolve-owner-email";
import { canExtendListingLifetime } from "@/lib/posts/listing-lifetime";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteUrl } from "@/lib/supabase/env";

type ExpiryNoticeCandidate = {
  post_id: number;
  user_id: string;
  title: string;
  slug: string;
  expires_at: string;
  created_at: string;
  category_type: string;
};

/**
 * Pošle e-mail majitelům právě (nebo dříve) archivovaných inzerátů,
 * kteří ještě nedostali oznámení pro aktuální expires_at.
 */
export async function notifyExpiredListings(): Promise<number> {
  const adminResult = createAdminClient();
  if (!adminResult.ok) {
    console.error("notifyExpiredListings: admin client", adminResult.error);
    return 0;
  }

  const admin = adminResult.client;
  const myListingsUrl = `${getSiteUrl()}/moje-inzeraty`;

  const { data: candidates, error: candidatesError } = await admin.rpc(
    "get_listing_expiry_notice_candidates",
    { p_limit: LISTING_EXPIRY_NOTICE_BATCH_LIMIT },
  );

  if (candidatesError) {
    console.error("get_listing_expiry_notice_candidates:", candidatesError);
    return 0;
  }

  let notified = 0;
  for (const row of (candidates ?? []) as ExpiryNoticeCandidate[]) {
    const recipientEmail = await resolveOwnerEmail(admin, row.user_id);
    if (!recipientEmail) continue;

    const sent = await notifyListingExpired({
      recipientEmail,
      postTitle: row.title,
      expiresAt: row.expires_at,
      myListingsUrl,
      canRenew: canExtendListingLifetime(row.created_at, row.expires_at),
      isEvent: row.category_type === "udalost",
    });

    if (!sent) continue;

    const { error: markError } = await admin.rpc(
      "mark_listing_expiry_notice_sent",
      {
        p_post_id: row.post_id,
        p_expires_at: row.expires_at,
      },
    );

    if (markError) {
      console.error("mark_listing_expiry_notice_sent:", markError);
      continue;
    }

    notified += 1;
  }

  return notified;
}
