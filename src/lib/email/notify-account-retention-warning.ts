import { buildAccountRetentionWarningEmail } from "@/lib/email/templates/account-retention-warning";
import { sendTransactionalEmail } from "@/lib/email/send";

export type NotifyAccountRetentionWarningParams = {
  recipientEmail: string;
  nickname: string;
  loginUrl: string;
  deleteInDays: number;
};

export async function notifyAccountRetentionWarning(
  params: NotifyAccountRetentionWarningParams,
): Promise<boolean> {
  const emailContent = buildAccountRetentionWarningEmail({
    nickname: params.nickname,
    loginUrl: params.loginUrl,
    deleteInDays: params.deleteInDays,
  });

  return sendTransactionalEmail({
    to: params.recipientEmail,
    subject: emailContent.subject,
    text: emailContent.text,
  });
}

