import { buildBlockedListingStaleWarningEmail } from "@/lib/email/templates/blocked-listing-stale-warning";
import { sendTransactionalEmail } from "@/lib/email/send";

export type NotifyBlockedListingStaleWarningParams = {
  recipientEmail: string;
  postTitle: string;
  myListingsUrl: string;
  deleteInDays: number;
};

export async function notifyBlockedListingStaleWarning(
  params: NotifyBlockedListingStaleWarningParams,
): Promise<boolean> {
  const emailContent = buildBlockedListingStaleWarningEmail({
    postTitle: params.postTitle,
    myListingsUrl: params.myListingsUrl,
    deleteInDays: params.deleteInDays,
  });

  return sendTransactionalEmail({
    to: params.recipientEmail,
    subject: emailContent.subject,
    text: emailContent.text,
  });
}
