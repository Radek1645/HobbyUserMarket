import { LISTING_MAX_LIFETIME_DAYS } from "@/config/listing-lifetime";
import { SITE_DISPLAY_NAME } from "@/config/site";

type BuildListingExpiredEmailParams = {
  postTitle: string;
  expiresLabel: string;
  myListingsUrl: string;
  canRenew: boolean;
  isEvent: boolean;
};

export function buildListingExpiredEmail(
  params: BuildListingExpiredEmailParams,
): { subject: string; text: string } {
  if (params.isEvent) {
    const nextStep = params.canRenew
      ? `Pokud akci pořádáte znovu, upravte termín v sekci Moje inzeráty.

Moje inzeráty:
${params.myListingsUrl}`
      : `Maximální doba existence (${LISTING_MAX_LIFETIME_DAYS} dní od založení) je vyčerpána. Další akci založte jako nový inzerát.

Moje inzeráty:
${params.myListingsUrl}`;

    return {
      subject: `Událost už není na webu: ${params.postTitle}`,
      text: `Dobrý den,

inzerát k události „${params.postTitle}" už není na veřejném webu — den konání uplynul.

${nextStep}

---
${SITE_DISPLAY_NAME}
`,
    };
  }

  const nextStep = params.canRenew
    ? `Inzerát máte dál uložený. Obnovit ho můžete v sekci Moje inzeráty, bez spotřeby dalšího kreditu (nejdéle do ${LISTING_MAX_LIFETIME_DAYS} dní od založení).

Obnovit inzerát:
${params.myListingsUrl}`
    : `Maximální doba existence (${LISTING_MAX_LIFETIME_DAYS} dní od založení) je vyčerpána, takže obnovení už není možné. Další nabídku založte jako nový inzerát.

Moje inzeráty:
${params.myListingsUrl}`;

  return {
    subject: `Platnost inzerátu skončila: ${params.postTitle}`,
    text: `Dobrý den,

váš inzerát „${params.postTitle}" už není na veřejném webu — platnost skončila ${params.expiresLabel}.

${nextStep}

---
${SITE_DISPLAY_NAME}
`,
  };
}
