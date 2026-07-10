import { buildAccountSelfDeletedEmail } from "@/lib/email/templates/account-deleted-self";
import { sendTransactionalEmail } from "@/lib/email/send";

export type NotifyAccountSelfDeletedParams = {
  recipientEmail: string;
  nickname: string;
};

export async function notifyAccountSelfDeleted(
  params: NotifyAccountSelfDeletedParams,
): Promise<boolean> {
  const emailContent = buildAccountSelfDeletedEmail({
    nickname: params.nickname,
  });

  return sendTransactionalEmail({
    to: params.recipientEmail,
    subject: emailContent.subject,
    text: emailContent.text,
  });
}
