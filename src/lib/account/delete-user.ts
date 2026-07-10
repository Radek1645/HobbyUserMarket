import { notifyAccountDeletedByPlatform } from "@/lib/email/notify-account-deleted-by-platform";
import { notifyAccountSelfDeleted } from "@/lib/email/notify-account-deleted-self";
import { resolveOwnerEmail } from "@/lib/inquiry/resolve-owner-email";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

export type DeleteUserAccountSource = "self" | "admin";

export type DeleteUserAccountParams = {
  userId: string;
  actorId: string;
  source: DeleteUserAccountSource;
  reasonCode?: string;
  reasonNote?: string;
  /** Volitelně — urychlí lookup před smazáním profilu. */
  knownEmail?: string;
  knownNickname?: string;
};

export type DeleteUserAccountResult =
  | { ok: true; emailSent: boolean }
  | { ok: false; error: string };

type AccountNotifyPayload = {
  recipientEmail: string;
  nickname: string;
  reasonCode?: string;
  reasonNote?: string;
};

async function resolveAccountNotifyPayload(
  client: SupabaseClient,
  params: DeleteUserAccountParams,
): Promise<AccountNotifyPayload | null> {
  const { data: profile } = await client
    .from("profiles")
    .select("nickname, email")
    .eq("id", params.userId)
    .maybeSingle<{ nickname: string; email: string | null }>();

  const recipientEmail =
    params.knownEmail?.trim() ||
    profile?.email?.trim() ||
    (await resolveOwnerEmail(client, params.userId));

  if (!recipientEmail) {
    console.error(
      "account deletion email skipped: recipient not found",
      params.userId,
    );
    return null;
  }

  const nickname =
    params.knownNickname?.trim() ||
    profile?.nickname?.trim() ||
    recipientEmail.split("@")[0] ||
    "uživateli";

  if (params.source === "admin") {
    if (!params.reasonCode) {
      console.error("account deletion email skipped: missing reasonCode");
      return null;
    }

    return {
      recipientEmail,
      nickname,
      reasonCode: params.reasonCode,
      reasonNote: params.reasonNote,
    };
  }

  return { recipientEmail, nickname };
}

export async function deleteUserAccount(
  params: DeleteUserAccountParams,
): Promise<DeleteUserAccountResult> {
  const adminResult = createAdminClient();
  if (!adminResult.ok) {
    return { ok: false, error: adminResult.error };
  }

  const { client } = adminResult;
  const notifyPayload = await resolveAccountNotifyPayload(client, params);

  const { error: rpcError } = await client.rpc("prepare_user_account_deletion", {
    p_user_id: params.userId,
    p_actor_id: params.actorId,
    p_source: params.source,
    p_reason_code: params.reasonCode ?? null,
    p_reason_note: params.reasonNote ?? null,
  });

  if (rpcError) {
    console.error("prepare_user_account_deletion:", rpcError);
    return { ok: false, error: "Nepodařilo se připravit smazání účtu." };
  }

  const { error: authError } = await client.auth.admin.deleteUser(params.userId);

  if (authError) {
    console.error("auth.admin.deleteUser:", authError);
    return { ok: false, error: "Nepodařilo se smazat přihlašovací účet." };
  }

  let emailSent = false;

  if (notifyPayload) {
    if (params.source === "admin" && notifyPayload.reasonCode) {
      emailSent = await notifyAccountDeletedByPlatform({
        recipientEmail: notifyPayload.recipientEmail,
        nickname: notifyPayload.nickname,
        reasonCode: notifyPayload.reasonCode,
        reasonNote: notifyPayload.reasonNote,
      });
    } else if (params.source === "self") {
      emailSent = await notifyAccountSelfDeleted({
        recipientEmail: notifyPayload.recipientEmail,
        nickname: notifyPayload.nickname,
      });
    }
  }

  if (notifyPayload && !emailSent) {
    console.error("account deletion email not delivered:", {
      userId: params.userId,
      to: notifyPayload.recipientEmail,
      source: params.source,
    });
  }

  return { ok: true, emailSent };
}
