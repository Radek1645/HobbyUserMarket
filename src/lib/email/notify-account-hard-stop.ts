import {
  ACCOUNT_SUSPENDED_PATH,
  normalizeBlacklistEmail,
  type AccountBlacklistSource,
} from "@/config/account-blacklist";
import { DSA_CONTACT_PATH, VOP_PATH } from "@/config/legal";
import { buildAccountHardStopEmail } from "@/lib/email/templates/account-hard-stop";
import { sendTransactionalEmail } from "@/lib/email/send";
import { resolveOwnerEmail } from "@/lib/inquiry/resolve-owner-email";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteUrl } from "@/lib/supabase/env";

export type NotifyAccountHardStopParams = {
  email: string;
  source: AccountBlacklistSource;
  reason: string;
  /** Pokud známe user_id, e-mail se ověří přes resolveOwnerEmail. */
  userId?: string | null;
};

/** SoR při hard stopu (VOP §4.5 / §4.6) — neblokuje hlavní operaci. */
export async function notifyAccountHardStop(
  params: NotifyAccountHardStopParams,
): Promise<boolean> {
  const fallbackEmail = normalizeBlacklistEmail(params.email);
  if (!fallbackEmail) return false;

  let recipientEmail = fallbackEmail;
  if (params.userId) {
    const adminResult = createAdminClient();
    if (adminResult.ok) {
      const resolved = await resolveOwnerEmail(
        adminResult.client,
        params.userId,
      );
      if (resolved) recipientEmail = resolved;
    }
  }

  const siteUrl = getSiteUrl();
  const content = buildAccountHardStopEmail({
    suspendedPageUrl: `${siteUrl}${ACCOUNT_SUSPENDED_PATH}`,
    vopUrl: `${siteUrl}${VOP_PATH}`,
    dsaUrl: `${siteUrl}${DSA_CONTACT_PATH}`,
    source: params.source,
    reason: params.reason,
  });

  return sendTransactionalEmail({
    to: recipientEmail,
    subject: content.subject,
    text: content.text,
  });
}
