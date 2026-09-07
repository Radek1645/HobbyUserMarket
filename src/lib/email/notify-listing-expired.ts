import { buildListingExpiredEmail } from "@/lib/email/templates/listing-expired";
import { sendTransactionalEmail } from "@/lib/email/send";

export type NotifyListingExpiredParams = {
  recipientEmail: string;
  postTitle: string;
  expiresAt: string;
  myListingsUrl: string;
  canRenew: boolean;
  isEvent: boolean;
};

/** Oznámení majiteli, že inzerát zmizel z webu po expiraci. */
export async function notifyListingExpired(
  params: NotifyListingExpiredParams,
): Promise<boolean> {
  const expiresLabel = new Date(params.expiresAt).toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const emailContent = buildListingExpiredEmail({
    postTitle: params.postTitle,
    expiresLabel,
    myListingsUrl: params.myListingsUrl,
    canRenew: params.canRenew,
    isEvent: params.isEvent,
  });

  return sendTransactionalEmail({
    to: params.recipientEmail,
    subject: emailContent.subject,
    text: emailContent.text,
  });
}
