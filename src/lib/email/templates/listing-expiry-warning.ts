import { LISTING_MAX_LIFETIME_DAYS } from "@/config/listing-lifetime";
import { SITE_DISPLAY_NAME } from "@/config/site";

type BuildListingExpiryWarningEmailParams = {
  postTitle: string;
  expiresLabel: string;
  myListingsUrl: string;
  listingUrl: string;
  /** false = už nelze obnovit (dosažen strop životnosti od založení). */
  canRenew: boolean;
};

export function buildListingExpiryWarningEmail(
  params: BuildListingExpiryWarningEmailParams,
): { subject: string; text: string } {
  const renewBlock = params.canRenew
    ? `Po tomto datu inzerát zmizí z veřejného webu. Obnovit ho můžete v sekci Moje inzeráty — bez spotřeby dalšího kreditu, nejdéle však do ${LISTING_MAX_LIFETIME_DAYS} dní od založení inzerátu.

Obnovit / spravovat:
${params.myListingsUrl}`
    : `Po tomto datu inzerát zmizí z veřejného webu. Maximální doba existence (${LISTING_MAX_LIFETIME_DAYS} dní od založení) je vyčerpána — obnovení již není možné. Pro další nabídku založte nový inzerát.

Moje inzeráty:
${params.myListingsUrl}`;

  const text = `Dobrý den,

platnost vašeho inzerátu „${params.postTitle}" brzy skončí (${params.expiresLabel}).

${renewBlock}

Detail inzerátu:
${params.listingUrl}

---
${SITE_DISPLAY_NAME}
`;

  return {
    subject: `Brzy vyprší inzerát: ${params.postTitle}`,
    text,
  };
}
