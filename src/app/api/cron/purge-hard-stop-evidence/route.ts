import {
  EVIDENCE_IMAGE_DAYS,
  RETENTION_MONTHS,
} from "@/config/gdpr-retention";
import { MODERATION_EVIDENCE_BUCKET } from "@/config/moderation";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

const BATCH_LIMIT = 500;

/**
 * Denní cron — hard-stop evidence: soubor po EVIDENCE_IMAGE_DAYS,
 * řádek a historie unban po RETENTION_MONTHS. Aktivní blacklist se nemaže.
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
  const imageCutoff = new Date(
    Date.now() - EVIDENCE_IMAGE_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();
  const rowCutoffDate = new Date();
  rowCutoffDate.setMonth(rowCutoffDate.getMonth() - RETENTION_MONTHS);
  const rowCutoff = rowCutoffDate.toISOString();

  const { data: imageRows, error: imageSelectError } = await admin
    .from("moderation_hard_reject_evidence")
    .select("id, storage_path")
    .not("storage_path", "is", null)
    .lt("created_at", imageCutoff)
    .limit(BATCH_LIMIT);

  if (imageSelectError) {
    console.error("hard-stop evidence image select:", imageSelectError);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  const storagePaths = (imageRows ?? [])
    .map((row) => row.storage_path)
    .filter((path): path is string => Boolean(path));

  let storageDeleted = 0;
  if (storagePaths.length > 0) {
    const { error: storageError } = await admin.storage
      .from(MODERATION_EVIDENCE_BUCKET)
      .remove(storagePaths);
    if (storageError) {
      console.error("hard-stop storage remove:", storageError);
    } else {
      storageDeleted = storagePaths.length;
      const imageIds = (imageRows ?? []).map((row) => row.id);
      const { error: clearPathError } = await admin
        .from("moderation_hard_reject_evidence")
        .update({ storage_path: null })
        .in("id", imageIds);
      if (clearPathError) {
        console.error("hard-stop storage_path null:", clearPathError);
      }
    }
  }

  const { error: evidenceDeleteError, count: evidenceDeleted } = await admin
    .from("moderation_hard_reject_evidence")
    .delete({ count: "exact" })
    .lt("created_at", rowCutoff);

  if (evidenceDeleteError) {
    console.error("hard-stop evidence delete:", evidenceDeleteError);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  const { error: blacklistDeleteError, count: blacklistDeleted } = await admin
    .from("account_blacklist")
    .delete({ count: "exact" })
    .not("removed_at", "is", null)
    .lt("removed_at", rowCutoff);

  if (blacklistDeleteError) {
    console.error("hard-stop blacklist history delete:", blacklistDeleteError);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    evidenceImageDays: EVIDENCE_IMAGE_DAYS,
    retentionMonths: RETENTION_MONTHS,
    storageDeleted,
    evidenceDeleted: evidenceDeleted ?? 0,
    blacklistHistoryDeleted: blacklistDeleted ?? 0,
  });
}
