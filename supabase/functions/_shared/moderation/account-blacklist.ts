/**
 * Hard stop — blacklist e-mailu + skrytí inzerátů (Edge, service role).
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";
import {
  ACCOUNT_BLACKLIST_REASON_AUTOMATIC,
  HARD_REJECT_AUTOBAN_THRESHOLD,
} from "./constants.ts";

function createServiceClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("BLACKLIST_SUPABASE_ENV_MISSING");
  }
  return createClient(supabaseUrl, serviceRoleKey);
}

export function normalizeBlacklistEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function isEmailBlacklisted(email: string): Promise<boolean> {
  const normalized = normalizeBlacklistEmail(email);
  if (!normalized) return false;
  try {
    const admin = createServiceClient();
    const { data, error } = await admin.rpc("is_email_blacklisted", {
      p_email: normalized,
    });
    if (error) {
      console.error("is_email_blacklisted rpc:", error);
      return false;
    }
    return Boolean(data);
  } catch (error) {
    console.error("is_email_blacklisted:", error);
    return false;
  }
}

async function hideListingsForUser(
  admin: ReturnType<typeof createServiceClient>,
  userId: string,
): Promise<void> {
  const { error } = await admin
    .from("posts")
    .update({
      status: "blocked",
      status_reason_code: "account_blacklist",
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .in("status", ["active", "hidden"]);

  if (error) {
    console.error("hideListingsForUser:", error);
  }
}

/** Fire-and-forget SoR e-mail přes Next.js (Resend). */
async function notifyHardStopEmail(params: {
  email: string;
  userId: string;
  reason: string;
}): Promise<void> {
  const siteUrl = (
    Deno.env.get("SITE_URL") ??
    Deno.env.get("NEXT_PUBLIC_SITE_URL") ??
    "https://zapikolou.cz"
  ).replace(/\/$/, "");
  const secret = Deno.env.get("CRON_SECRET");
  if (!secret) {
    console.error("notifyHardStopEmail: missing CRON_SECRET");
    return;
  }

  try {
    const response = await fetch(
      `${siteUrl}/api/internal/notify-account-hard-stop`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: params.email,
          userId: params.userId,
          source: "automatic",
          reason: params.reason,
        }),
      },
    );
    if (!response.ok) {
      console.error(
        "notifyHardStopEmail http:",
        response.status,
        await response.text().catch(() => ""),
      );
    }
  } catch (error) {
    console.error("notifyHardStopEmail:", error);
  }
}

/**
 * Vloží aktivní blacklist (idempotentní) a skryje inzeráty.
 * @returns true pokud je účet na blacklistu (nově nebo už byl).
 */
export async function applyAutomaticAccountBlacklist(params: {
  userId: string;
  email: string | null | undefined;
}): Promise<boolean> {
  const email = params.email
    ? normalizeBlacklistEmail(params.email)
    : "";
  if (!email) {
    console.error("applyAutomaticAccountBlacklist: missing email", params.userId);
    return false;
  }

  try {
    const admin = createServiceClient();

    const { data: existing } = await admin
      .from("account_blacklist")
      .select("id")
      .eq("email", email)
      .is("removed_at", null)
      .maybeSingle();

    let newlyInserted = false;
    if (!existing) {
      const { error } = await admin.from("account_blacklist").insert({
        email,
        reason: ACCOUNT_BLACKLIST_REASON_AUTOMATIC,
        source: "automatic",
      });
      if (error && error.code !== "23505") {
        console.error("account_blacklist insert:", error);
        return false;
      }
      newlyInserted = !error;
    }

    await hideListingsForUser(admin, params.userId);
    console.log(
      "account_blacklist_applied:",
      JSON.stringify({
        userId: params.userId,
        email,
        threshold: HARD_REJECT_AUTOBAN_THRESHOLD,
        newlyInserted,
      }),
    );

    if (newlyInserted) {
      // Nečekáme na e-mail — hard stop response má jít hned.
      void notifyHardStopEmail({
        email,
        userId: params.userId,
        reason: ACCOUNT_BLACKLIST_REASON_AUTOMATIC,
      });
    }

    return true;
  } catch (error) {
    console.error("applyAutomaticAccountBlacklist:", error);
    return false;
  }
}
