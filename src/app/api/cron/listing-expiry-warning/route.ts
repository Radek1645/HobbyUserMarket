import {
  LISTING_EXPIRY_WARNING_BATCH_LIMIT,
  LISTING_EXPIRY_WARNING_DAYS_BEFORE,
} from "@/config/listing-expiry";
import { notifyListingExpiryWarning } from "@/lib/email/notify-listing-expiry-warning";
import { resolveOwnerEmail } from "@/lib/inquiry/resolve-owner-email";
import { canExtendListingLifetime } from "@/lib/posts/listing-lifetime";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteUrl } from "@/lib/supabase/env";
import { NextResponse } from "next/server";

type ExpiryWarningCandidate = {
  post_id: number;
  user_id: string;
  title: string;
  slug: string;
  expires_at: string;
  created_at: string;
};

/**
 * Denní cron — e-mail majitelům inzerátů, které brzy expirují.
 * Vercel Cron: Authorization: Bearer CRON_SECRET.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminResult = createAdminClient();
  if (!adminResult.ok) {
    return NextResponse.json({ error: adminResult.error }, { status: 500 });
  }

  const admin = adminResult.client;
  const siteUrl = getSiteUrl();
  const myListingsUrl = `${siteUrl}/moje-inzeraty`;

  const { data: candidates, error: candidatesError } = await admin.rpc(
    "get_listing_expiry_warning_candidates",
    {
      p_days_before: LISTING_EXPIRY_WARNING_DAYS_BEFORE,
      p_limit: LISTING_EXPIRY_WARNING_BATCH_LIMIT,
    },
  );

  if (candidatesError) {
    console.error("get_listing_expiry_warning_candidates:", candidatesError);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  let warned = 0;
  for (const row of (candidates ?? []) as ExpiryWarningCandidate[]) {
    const recipientEmail = await resolveOwnerEmail(admin, row.user_id);
    if (!recipientEmail) continue;

    const sent = await notifyListingExpiryWarning({
      recipientEmail,
      postTitle: row.title,
      expiresAt: row.expires_at,
      myListingsUrl,
      listingUrl: `${siteUrl}/inzerat/${row.slug}`,
      canRenew: canExtendListingLifetime(row.created_at, row.expires_at),
    });

    if (!sent) continue;

    const { error: markError } = await admin.rpc(
      "mark_listing_expiry_warning_sent",
      {
        p_post_id: row.post_id,
        p_expires_at: row.expires_at,
      },
    );

    if (markError) {
      console.error("mark_listing_expiry_warning_sent:", markError);
      continue;
    }

    warned += 1;
  }

  return NextResponse.json({ ok: true, warned });
}
