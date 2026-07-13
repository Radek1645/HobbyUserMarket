import {
  GDPR_RETENTION_DELETE_AFTER_DAYS,
  GDPR_RETENTION_REASON_CODE,
  GDPR_RETENTION_WARNING_AFTER_DAYS,
  GDPR_RETENTION_WARNING_BEFORE_DAYS,
} from "@/config/gdpr-retention";
import { notifyAccountDeletedByPlatform } from "@/lib/email/notify-account-deleted-by-platform";
import { notifyAccountRetentionWarning } from "@/lib/email/notify-account-retention-warning";
import { resolveOwnerEmail } from "@/lib/inquiry/resolve-owner-email";
import { getSiteUrl } from "@/lib/supabase/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

type WarningCandidate = { user_id: string; last_sign_in_at: string | null };
type DeletionCandidate = { user_id: string };

async function resolveNickname(
  admin: SupabaseClient,
  userId: string,
): Promise<string> {
  const { data: profile } = await admin
    .from("profiles")
    .select("nickname")
    .eq("id", userId)
    .maybeSingle<{ nickname: string }>();

  return profile?.nickname?.trim() || "uživateli";
}

/**
 * Denní GDPR retence — varování + anonymizace/smazání neaktivních účtů (PRD §5.5).
 * Vercel Cron posílá Authorization: Bearer CRON_SECRET.
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
  const loginUrl = `${getSiteUrl()}/login`;

  const { data: warningCandidates, error: warningError } = await admin.rpc(
    "get_gdpr_retention_warning_candidates",
    {
      p_warning_after_days: GDPR_RETENTION_WARNING_AFTER_DAYS,
      p_delete_after_days: GDPR_RETENTION_DELETE_AFTER_DAYS,
      p_limit: 200,
    },
  );

  if (warningError) {
    console.error("get_gdpr_retention_warning_candidates:", warningError);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  let warned = 0;
  for (const row of (warningCandidates ?? []) as WarningCandidate[]) {
    const lastSignInAt = row.last_sign_in_at;
    if (!lastSignInAt) continue;

    const recipientEmail = await resolveOwnerEmail(admin, row.user_id);
    if (!recipientEmail) continue;

    const nickname = await resolveNickname(admin, row.user_id);
    const sent = await notifyAccountRetentionWarning({
      recipientEmail,
      nickname,
      loginUrl,
      deleteInDays: GDPR_RETENTION_WARNING_BEFORE_DAYS,
    });

    if (!sent) continue;

    const { error: markError } = await admin.rpc(
      "mark_gdpr_retention_warning_sent",
      { p_user_id: row.user_id, p_last_sign_in_at: lastSignInAt },
    );

    if (markError) {
      console.error("mark_gdpr_retention_warning_sent:", markError);
      continue;
    }

    warned += 1;
  }

  const { data: deletionCandidates, error: deletionError } = await admin.rpc(
    "get_gdpr_retention_deletion_candidates",
    { p_delete_after_days: GDPR_RETENTION_DELETE_AFTER_DAYS, p_limit: 200 },
  );

  if (deletionError) {
    console.error("get_gdpr_retention_deletion_candidates:", deletionError);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  let deleted = 0;
  for (const row of (deletionCandidates ?? []) as DeletionCandidate[]) {
    const userId = row.user_id;

    // Před anonymizací si vytáhneme e-mail/nickname, protože profil se během přípravy přepíše.
    const recipientEmail = await resolveOwnerEmail(admin, userId);
    const nickname = await resolveNickname(admin, userId);

    const { error: rpcError } = await admin.rpc("prepare_user_account_deletion", {
      p_user_id: userId,
      p_actor_id: null,
      p_source: "admin",
      p_reason_code: GDPR_RETENTION_REASON_CODE,
      p_reason_note:
        "Účet byl dlouhodobě neaktivní a neměl žádný aktivní inzerát (automatická GDPR retence).",
    });

    if (rpcError) {
      console.error("prepare_user_account_deletion:", rpcError);
      continue;
    }

    const { error: authError } = await admin.auth.admin.deleteUser(userId);
    if (authError) {
      console.error("auth.admin.deleteUser:", authError);
      continue;
    }

    if (recipientEmail) {
      await notifyAccountDeletedByPlatform({
        recipientEmail,
        nickname,
        reasonCode: GDPR_RETENTION_REASON_CODE,
        reasonNote:
          "Účet byl dlouhodobě neaktivní a neměl žádný aktivní inzerát (automatická GDPR retence).",
      });
    }

    deleted += 1;
  }

  return NextResponse.json({ ok: true, warned, deleted });
}

