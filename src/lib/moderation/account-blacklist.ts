import {
  ACCOUNT_BLACKLIST_REASON_AUTOMATIC,
  ACCOUNT_BLACKLIST_SOURCE,
  normalizeBlacklistEmail,
  type AccountBlacklistSource,
} from "@/config/account-blacklist";
import { POST_STATUS } from "@/config/post-status";
import { POST_STATUS_REASON } from "@/config/listing-status-reasons";
import type { SupabaseClient } from "@supabase/supabase-js";

export type AccountBlacklistRow = {
  id: string;
  blacklist_no: number;
  email: string;
  reason: string;
  source: AccountBlacklistSource;
  created_at: string;
  created_by: string | null;
  removed_at: string | null;
  removed_by: string | null;
  removed_reason: string | null;
};

/** Skryje veřejné / pozastavené inzeráty uživatele (bez mazání). Draft a archived nechá. */
export async function hideListingsForBlacklistedUser(
  admin: SupabaseClient,
  userId: string,
): Promise<number> {
  const { data, error } = await admin
    .from("posts")
    .update({
      status: POST_STATUS.blocked,
      status_reason_code: POST_STATUS_REASON.account_blacklist,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .in("status", [POST_STATUS.active, POST_STATUS.hidden])
    .select("id");

  if (error) {
    console.error("hideListingsForBlacklistedUser:", error);
    return 0;
  }
  return data?.length ?? 0;
}

/**
 * Po unbanu obnoví inzeráty skryté kvůli hard stopu zpět na active
 * (jen `status_reason_code = account_blacklist`).
 */
export async function restoreListingsAfterBlacklistRemoval(
  admin: SupabaseClient,
  userId: string,
): Promise<number> {
  const { data, error } = await admin
    .from("posts")
    .update({
      status: POST_STATUS.active,
      status_reason_code: null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("status", POST_STATUS.blocked)
    .eq("status_reason_code", POST_STATUS_REASON.account_blacklist)
    .select("id");

  if (error) {
    console.error("restoreListingsAfterBlacklistRemoval:", error);
    return 0;
  }
  return data?.length ?? 0;
}

export async function findUserIdByEmail(
  admin: SupabaseClient,
  email: string,
): Promise<string | null> {
  const normalized = normalizeBlacklistEmail(email);
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .ilike("email", normalized)
    .limit(1)
    .maybeSingle<{ id: string }>();

  return profile?.id ?? null;
}

type ApplyBlacklistParams = {
  admin: SupabaseClient;
  email: string;
  reason: string;
  source: AccountBlacklistSource;
  createdBy?: string | null;
  /** Pokud známe user_id, skryjeme inzeráty hned. */
  userId?: string | null;
};

/**
 * Vloží aktivní blacklist (idempotentní). Vrátí true, pokud byl nový záznam.
 */
export async function applyAccountBlacklist(
  params: ApplyBlacklistParams,
): Promise<{ inserted: boolean; userId: string | null }> {
  const email = normalizeBlacklistEmail(params.email);
  if (!email) {
    return { inserted: false, userId: params.userId ?? null };
  }

  const { data: existing } = await params.admin
    .from("account_blacklist")
    .select("id")
    .eq("email", email)
    .is("removed_at", null)
    .maybeSingle<{ id: string }>();

  let inserted = false;
  if (!existing) {
    const { error } = await params.admin.from("account_blacklist").insert({
      email,
      reason: params.reason,
      source: params.source,
      created_by: params.createdBy ?? null,
    });
    if (error) {
      // Race na unique index — bereme jako už blacklisted.
      if (error.code !== "23505") {
        console.error("applyAccountBlacklist insert:", error);
        return { inserted: false, userId: params.userId ?? null };
      }
    } else {
      inserted = true;
    }
  }

  let userId = params.userId ?? null;
  if (!userId) {
    userId = await findUserIdByEmail(params.admin, email);
  }
  if (userId) {
    await hideListingsForBlacklistedUser(params.admin, userId);
  }

  return { inserted, userId };
}

export async function removeFromAccountBlacklist(params: {
  admin: SupabaseClient;
  blacklistId: string;
  removedBy: string;
  removedReason: string;
}): Promise<
  | { ok: true; restoredListings: number; email: string; userId: string | null }
  | { ok: false; error: string }
> {
  const reason = params.removedReason.trim();
  if (!reason) {
    return { ok: false, error: "missing_reason" };
  }

  const { data, error } = await params.admin
    .from("account_blacklist")
    .update({
      removed_at: new Date().toISOString(),
      removed_by: params.removedBy,
      removed_reason: reason.slice(0, 500),
    })
    .eq("id", params.blacklistId)
    .is("removed_at", null)
    .select("id, email")
    .maybeSingle<{ id: string; email: string }>();

  if (error) {
    console.error("removeFromAccountBlacklist:", error);
    return { ok: false, error: "db_error" };
  }
  if (!data) {
    return { ok: false, error: "not_found" };
  }

  let restoredListings = 0;
  const userId = await findUserIdByEmail(params.admin, data.email);
  if (userId) {
    restoredListings = await restoreListingsAfterBlacklistRemoval(
      params.admin,
      userId,
    );
  }

  return { ok: true, restoredListings, email: data.email, userId };
}

export { ACCOUNT_BLACKLIST_REASON_AUTOMATIC, ACCOUNT_BLACKLIST_SOURCE };
