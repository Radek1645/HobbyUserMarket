import { buildListingExpiryWarningEmail } from "@/lib/email/templates/listing-expiry-warning";
import { sendTransactionalEmail } from "@/lib/email/send";

export type NotifyListingExpiryWarningParams = {
  recipientEmail: string;
  postTitle: string;
  expiresAt: string;
  myListingsUrl: string;
  listingUrl: string;
  canRenew: boolean;
};

export async function notifyListingExpiryWarning(
  params: NotifyListingExpiryWarningParams,
): Promise<boolean> {
  const expiresLabel = new Date(params.expiresAt).toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const emailContent = buildListingExpiryWarningEmail({
    postTitle: params.postTitle,
    expiresLabel,
    myListingsUrl: params.myListingsUrl,
    listingUrl: params.listingUrl,
    canRenew: params.canRenew,
  });

  return sendTransactionalEmail({
    to: params.recipientEmail,
    subject: emailContent.subject,
    text: emailContent.text,
  });
}
