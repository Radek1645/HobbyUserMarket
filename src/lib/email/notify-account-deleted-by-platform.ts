import { buildAccountDeletedByPlatformEmail } from "@/lib/email/templates/account-deleted-by-platform";
import { sendTransactionalEmail } from "@/lib/email/send";
import { DSA_CONTACT_PATH, VOP_PATH } from "@/config/legal";
import { getSiteUrl } from "@/lib/supabase/env";

export type NotifyAccountDeletedParams = {
  recipientEmail: string;
  nickname: string;
  reasonCode: string;
  reasonNote?: string;
};

export async function notifyAccountDeletedByPlatform(
  params: NotifyAccountDeletedParams,
): Promise<boolean> {
  const siteUrl = getSiteUrl();
  const emailContent = buildAccountDeletedByPlatformEmail({
    nickname: params.nickname,
    dsaUrl: `${siteUrl}${DSA_CONTACT_PATH}`,
    vopUrl: `${siteUrl}${VOP_PATH}`,
    reasonCode: params.reasonCode,
    reasonNote: params.reasonNote,
  });

  return sendTransactionalEmail({
    to: params.recipientEmail,
    subject: emailContent.subject,
    text: emailContent.text,
  });
}
