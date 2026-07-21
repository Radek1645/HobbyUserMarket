import { buildAccountUnbannedEmail } from "@/lib/email/templates/account-unbanned";
import { sendTransactionalEmail } from "@/lib/email/send";
import { resolveOwnerEmail } from "@/lib/inquiry/resolve-owner-email";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteUrl } from "@/lib/supabase/env";
import { normalizeBlacklistEmail } from "@/config/account-blacklist";

export type NotifyAccountUnbannedParams = {
  email: string;
  removedReason: string;
  userId?: string | null;
};

/** Potvrzení zrušení hard stopu — neblokuje hlavní operaci. */
export async function notifyAccountUnbanned(
  params: NotifyAccountUnbannedParams,
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
  const content = buildAccountUnbannedEmail({
    homeUrl: siteUrl,
    myListingsUrl: `${siteUrl}/moje-inzeraty`,
    removedReason: params.removedReason,
  });

  return sendTransactionalEmail({
    to: recipientEmail,
    subject: content.subject,
    text: content.text,
  });
}
