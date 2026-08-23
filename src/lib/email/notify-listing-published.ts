import { buildListingPublishedEmail } from "@/lib/email/templates/listing-published";
import { sendTransactionalEmail } from "@/lib/email/send";

export type NotifyListingPublishedParams = {
  recipientEmail: string;
  postTitle: string;
  listingUrl: string;
  myListingsUrl: string;
};

/** Potvrzení první publikace — chyba odeslání neblokuje redirect. */
export async function notifyListingPublished(
  params: NotifyListingPublishedParams,
): Promise<boolean> {
  const emailContent = buildListingPublishedEmail({
    postTitle: params.postTitle,
    listingUrl: params.listingUrl,
    myListingsUrl: params.myListingsUrl,
  });

  return sendTransactionalEmail({
    to: params.recipientEmail,
    subject: emailContent.subject,
    text: emailContent.text,
  });
}
