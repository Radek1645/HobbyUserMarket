"use server";

import {
  ACCOUNT_BLACKLIST_SOURCE,
  normalizeBlacklistEmail,
} from "@/config/account-blacklist";
import { getCurrentUser } from "@/lib/auth/get-user";
import { isStaffRole } from "@/lib/auth/is-staff-role";
import { notifyAccountHardStop } from "@/lib/email/notify-account-hard-stop";
import { notifyAccountUnbanned } from "@/lib/email/notify-account-unbanned";
import {
  applyAccountBlacklist,
  removeFromAccountBlacklist,
} from "@/lib/moderation/account-blacklist";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

function requireStaff() {
  return getCurrentUser().then((user) => {
    if (!user || !isStaffRole(user.role)) {
      redirect("/");
    }
    return user;
  });
}

export async function adminAddToBlacklist(formData: FormData) {
  const staff = await requireStaff();
  const emailRaw = String(formData.get("email") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  const email = normalizeBlacklistEmail(emailRaw);

  if (!email || !email.includes("@")) {
    redirect("/mod/blacklist?error=invalid_email");
  }
  if (!reason) {
    redirect("/mod/blacklist?error=missing_reason");
  }

  const adminResult = createAdminClient();
  if (!adminResult.ok) {
    redirect("/mod/blacklist?error=admin_client");
  }

  const { inserted, userId } = await applyAccountBlacklist({
    admin: adminResult.client,
    email,
    reason: reason.slice(0, 500),
    source: ACCOUNT_BLACKLIST_SOURCE.manual,
    createdBy: staff.id,
  });

  if (inserted) {
    const emailSent = await notifyAccountHardStop({
      email,
      source: ACCOUNT_BLACKLIST_SOURCE.manual,
      reason: reason.slice(0, 500),
      userId,
    });
    redirect(
      emailSent
        ? "/mod/blacklist?added=1"
        : "/mod/blacklist?added=1&email_failed=1",
    );
  }

  redirect("/mod/blacklist?error=already_listed");
}

export async function adminRemoveFromBlacklist(formData: FormData) {
  const staff = await requireStaff();
  const blacklistId = String(formData.get("blacklistId") ?? "").trim();
  const removedReason = String(formData.get("removedReason") ?? "").trim();

  if (!blacklistId) {
    redirect("/mod/blacklist?error=missing_id");
  }
  if (!removedReason) {
    redirect("/mod/blacklist?error=missing_reason");
  }

  const adminResult = createAdminClient();
  if (!adminResult.ok) {
    redirect("/mod/blacklist?error=admin_client");
  }

  const result = await removeFromAccountBlacklist({
    admin: adminResult.client,
    blacklistId,
    removedBy: staff.id,
    removedReason,
  });

  if (!result.ok) {
    redirect(`/mod/blacklist?error=${result.error}`);
  }

  const emailSent = await notifyAccountUnbanned({
    email: result.email,
    removedReason,
    userId: result.userId,
  });

  redirect(
    emailSent
      ? "/mod/blacklist?removed=1"
      : "/mod/blacklist?removed=1&email_failed=1",
  );
}

export async function loadAccountBlacklist(params?: {
  includeRemoved?: boolean;
}) {
  const supabase = await createClient();
  let query = supabase
    .from("account_blacklist")
    .select(
      "id, blacklist_no, email, reason, source, created_at, created_by, removed_at, removed_by, removed_reason",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (!params?.includeRemoved) {
    query = query.is("removed_at", null);
  }

  const { data, error } = await query;
  if (error) {
    console.error("loadAccountBlacklist:", error);
    return [];
  }
  return data ?? [];
}
