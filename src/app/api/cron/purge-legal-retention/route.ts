import { LISTING_IMAGE_BUCKET } from "@/config/app";
import {
  BLOCKED_STALE_WARNING_DAYS,
  LISTING_PII_PURGE_DAYS,
  RETENTION_MONTHS,
} from "@/config/gdpr-retention";
import { notifyBlockedListingStaleWarning } from "@/lib/email/notify-blocked-listing-stale-warning";
import { resolveOwnerEmail } from "@/lib/inquiry/resolve-owner-email";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteUrl } from "@/lib/supabase/env";
import { NextResponse } from "next/server";

const BATCH_LIMIT = 200;

type PiiCandidateRow = {
  post_id: number;
  storage_path: string | null;
};

type BlockedWarningRow = {
  post_id: number;
  user_id: string;
  title: string;
  slug: string;
};

/**
 * Denní úklid právní retence (B1–B2): PII + fotky, DELETE starých řádků,
 * provozní tabulky, varování a překlopení stale blocked.
 * Storage před apply (cesty jsou v post_images). Batch apply; při chybě retry
 * po jednom ID, B2/B3 dál běží. location smí být NULL jen archived/deleted (083).
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

  const { data: piiRows, error: piiError } = await admin.rpc(
    "purge_hidden_listing_pii",
    { p_limit: BATCH_LIMIT },
  );

  if (piiError) {
    console.error("purge_hidden_listing_pii:", piiError);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  const candidates = (piiRows ?? []) as PiiCandidateRow[];
  const pathsByPost = new Map<number, string[]>();
  for (const row of candidates) {
    const paths = pathsByPost.get(row.post_id) ?? [];
    if (row.storage_path) {
      paths.push(row.storage_path);
    }
    pathsByPost.set(row.post_id, paths);
  }

  const purgedPostIds: number[] = [];
  for (const [postId, paths] of pathsByPost) {
    if (paths.length > 0) {
      const { error: storageError } = await admin.storage
        .from(LISTING_IMAGE_BUCKET)
        .remove(paths);
      if (storageError) {
        console.error("post-images remove:", postId, storageError);
        continue;
      }
    }
    purgedPostIds.push(postId);
  }

  let piiApplied = 0;
  let piiApplyFailed = false;
  if (purgedPostIds.length > 0) {
    const { data: applied, error: applyError } = await admin.rpc(
      "apply_hidden_listing_pii_purge",
      { p_post_ids: purgedPostIds },
    );
    if (!applyError) {
      piiApplied = typeof applied === "number" ? applied : purgedPostIds.length;
    } else {
      // Jeden 23502 v batchi rollbackne celé pole. Retry po jednom ID.
      console.error("apply_hidden_listing_pii_purge:", applyError);
      for (const postId of purgedPostIds) {
        const { error: oneError } = await admin.rpc(
          "apply_hidden_listing_pii_purge",
          { p_post_ids: [postId] },
        );
        if (oneError) {
          console.error("apply_hidden_listing_pii_purge:", postId, oneError);
          piiApplyFailed = true;
          continue;
        }
        piiApplied += 1;
      }
    }
  }

  const { data: rowsDeleted, error: rowsError } = await admin.rpc(
    "purge_hidden_listing_rows",
    { p_limit: BATCH_LIMIT },
  );
  if (rowsError) {
    console.error("purge_hidden_listing_rows:", rowsError);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  const { data: retention, error: retentionError } = await admin.rpc(
    "purge_retention_tables",
  );
  if (retentionError) {
    console.error("purge_retention_tables:", retentionError);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  const { data: warningCandidates, error: warningError } = await admin.rpc(
    "list_blocked_stale_warning_candidates",
    { p_limit: BATCH_LIMIT },
  );
  if (warningError) {
    console.error("list_blocked_stale_warning_candidates:", warningError);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  const siteUrl = getSiteUrl();
  let blockedWarned = 0;
  for (const row of (warningCandidates ?? []) as BlockedWarningRow[]) {
    const recipientEmail = await resolveOwnerEmail(admin, row.user_id);
    if (!recipientEmail) continue;

    const sent = await notifyBlockedListingStaleWarning({
      recipientEmail,
      postTitle: row.title,
      myListingsUrl: `${siteUrl}/moje-inzeraty`,
      deleteInDays: BLOCKED_STALE_WARNING_DAYS,
    });
    if (!sent) continue;

    const { error: markError } = await admin.rpc(
      "mark_blocked_stale_warning_sent",
      { p_post_id: row.post_id },
    );
    if (markError) {
      console.error("mark_blocked_stale_warning_sent:", markError);
      continue;
    }
    blockedWarned += 1;
  }

  const { data: blockedFlipped, error: flipError } = await admin.rpc(
    "flip_blocked_stale_listings",
    { p_limit: BATCH_LIMIT },
  );
  if (flipError) {
    console.error("flip_blocked_stale_listings:", flipError);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  if (piiApplyFailed) {
    return NextResponse.json(
      {
        error: "DB error",
        piiCandidates: pathsByPost.size,
        piiApplied,
        rowsDeleted: rowsDeleted ?? 0,
        retention,
        blockedWarned,
        blockedFlipped: blockedFlipped ?? 0,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    listingPiiPurgeDays: LISTING_PII_PURGE_DAYS,
    retentionMonths: RETENTION_MONTHS,
    piiCandidates: pathsByPost.size,
    piiApplied,
    rowsDeleted: rowsDeleted ?? 0,
    retention,
    blockedWarned,
    blockedFlipped: blockedFlipped ?? 0,
  });
}
