"use server";

import { deleteUserAccount as runDeleteUserAccount } from "@/lib/account/delete-user";
import { getCurrentUser } from "@/lib/auth/get-user";
import { ACCOUNT_DELETION_REASONS } from "@/config/moderation/account-deletion-reasons";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type AccountActionState = {
  error?: string;
};

export async function deleteMyAccount(
  _prev: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (formData.get("confirmDelete") !== "1") {
    return { error: "Potvrďte, že chápete nevratnost akce." };
  }

  const result = await runDeleteUserAccount({
    userId: user.id,
    actorId: user.id,
    source: "self",
    knownEmail: user.email,
    knownNickname: user.nickname,
  });

  if (!result.ok) {
    return { error: result.error };
  }

  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login?message=account_deleted");
}

export async function adminDeleteUserAccount(formData: FormData): Promise<void> {
  const actor = await getCurrentUser();
  if (!actor || actor.role !== "admin") {
    redirect("/");
  }

  const userId = String(formData.get("userId") ?? "").trim();
  const reasonCode = String(formData.get("reasonCode") ?? "").trim();
  const reasonNote = String(formData.get("reasonNote") ?? "").trim();

  if (!userId) {
    redirect("/mod/uzivatele?error=missing_user");
  }

  if (userId === actor.id) {
    redirect("/profil/nastaveni?error=self_delete_admin");
  }

  const validReason = ACCOUNT_DELETION_REASONS.some(
    (reason) => reason.code === reasonCode,
  );
  if (!validReason) {
    redirect("/mod/uzivatele?error=missing_reason");
  }

  const supabase = await createClient();
  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", userId)
    .maybeSingle<{ id: string; role: string }>();

  if (!targetProfile) {
    redirect("/mod/uzivatele?error=user_not_found");
  }

  if (targetProfile.role === "admin") {
    redirect("/mod/uzivatele?error=admin_protected");
  }

  const result = await runDeleteUserAccount({
    userId,
    actorId: actor.id,
    source: "admin",
    reasonCode,
    reasonNote: reasonNote || undefined,
  });

  if (!result.ok) {
    redirect(`/mod/uzivatele?error=${encodeURIComponent(result.error)}`);
  }

  revalidatePath("/mod/uzivatele");
  redirect(
    result.emailSent
      ? "/mod/uzivatele?deleted=1"
      : "/mod/uzivatele?deleted=1&email_failed=1",
  );
}
