import {
  HARD_STOP_EVIDENCE_RETENTION_DAYS,
} from "@/config/account-blacklist";
import { MODERATION_EVIDENCE_BUCKET } from "@/config/moderation";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

/**
 * Denní cron — smaže starou hard-stop evidenci (tabulka + storage) a
 * historické (odebrané) blacklist záznamy starší než retence.
 * Aktivní blacklist se nemaže.
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
  const cutoff = new Date(
    Date.now() - HARD_STOP_EVIDENCE_RETENTION_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data: evidenceRows, error: evidenceSelectError } = await admin
    .from("moderation_hard_reject_evidence")
    .select("id, storage_path")
    .lt("created_at", cutoff)
    .limit(500);

  if (evidenceSelectError) {
    console.error("hard-stop evidence select:", evidenceSelectError);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  const storagePaths = (evidenceRows ?? [])
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
    }
  }

  const evidenceIds = (evidenceRows ?? []).map((row) => row.id);
  let evidenceDeleted = 0;
  if (evidenceIds.length > 0) {
    const { error: deleteError, count } = await admin
      .from("moderation_hard_reject_evidence")
      .delete({ count: "exact" })
      .in("id", evidenceIds);
    if (deleteError) {
      console.error("hard-stop evidence delete:", deleteError);
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }
    evidenceDeleted = count ?? evidenceIds.length;
  }

  const { error: blacklistDeleteError, count: blacklistDeleted } = await admin
    .from("account_blacklist")
    .delete({ count: "exact" })
    .not("removed_at", "is", null)
    .lt("removed_at", cutoff);

  if (blacklistDeleteError) {
    console.error("hard-stop blacklist history delete:", blacklistDeleteError);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    retentionDays: HARD_STOP_EVIDENCE_RETENTION_DAYS,
    evidenceDeleted,
    storageDeleted,
    blacklistHistoryDeleted: blacklistDeleted ?? 0,
  });
}
