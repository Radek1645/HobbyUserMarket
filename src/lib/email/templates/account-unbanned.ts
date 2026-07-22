import {
  SITE_DISPLAY_NAME,
  SITE_OPERATOR_CONTACT_EMAIL,
} from "@/config/site";

type BuildAccountUnbannedEmailParams = {
  homeUrl: string;
  myListingsUrl: string;
  removedReason: string;
};

export function buildAccountUnbannedEmail(
  params: BuildAccountUnbannedEmailParams,
): { subject: string; text: string } {
  const note = params.removedReason.trim();

  const text = `Dobrý den,

pozastavení vašeho účtu na ${SITE_DISPLAY_NAME} bylo zrušeno.

Účet můžete znovu používat. Inzeráty, které byly skryty kvůli hard stopu, jsme obnovili.

${note ? `Poznámka moderátora:\n${note}\n\n` : ""}Přihlášení: ${params.homeUrl}
Moje inzeráty: ${params.myListingsUrl}

Dotazy: ${SITE_OPERATOR_CONTACT_EMAIL}

---
${SITE_DISPLAY_NAME}
`;

  return {
    subject: `Účet na ${SITE_DISPLAY_NAME} byl znovu zpřístupněn`,
    text,
  };
}
