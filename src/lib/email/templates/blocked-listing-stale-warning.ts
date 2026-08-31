import { OPERATOR_CONTACT_EMAIL } from "@/config/app";
import { SITE_DISPLAY_NAME } from "@/config/site";
import { BLOCKED_LISTING_RECOVERY_HINT } from "@/config/listing-status-reasons";

type BuildBlockedListingStaleWarningParams = {
  postTitle: string;
  myListingsUrl: string;
  deleteInDays: number;
};

export function buildBlockedListingStaleWarningEmail(
  params: BuildBlockedListingStaleWarningParams,
): { subject: string; text: string } {
  const text = `Dobrý den,

váš inzerát „${params.postTitle}" je zablokovaný a ${params.deleteInDays} dní se na něm nic nezměnilo.

Pokud ho neupravíte a znovu neodešlete ke schválení, po uplynutí této lhůty ho automaticky odstraníme. Telefon, přesná poloha a fotky se pak uklidí podle zásad ochrany osobních údajů.

${BLOCKED_LISTING_RECOVERY_HINT}
Správa inzerátů: ${params.myListingsUrl}

${OPERATOR_CONTACT_EMAIL ? `Kontakt provozovatele: ${OPERATOR_CONTACT_EMAIL}` : ""}

---
${SITE_DISPLAY_NAME}
`;

  return {
    subject: `Inzerát „${params.postTitle}" bude brzy odstraněn`,
    text,
  };
}
