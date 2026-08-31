import { OPERATOR_CONTACT_EMAIL } from "@/config/app";
import { SITE_DISPLAY_NAME } from "@/config/site";
import { getAccountDeletionReasonLabel } from "@/config/moderation/account-deletion-reasons";

type BuildAccountDeletedEmailParams = {
  nickname: string;
  dsaUrl: string;
  vopUrl: string;
  reasonCode: string;
  reasonNote?: string;
};

export function buildAccountDeletedByPlatformEmail(
  params: BuildAccountDeletedEmailParams,
): { subject: string; text: string } {
  const reasonLabel = getAccountDeletionReasonLabel(params.reasonCode);
  const note = params.reasonNote?.trim();

  const appealLines = [
    `Odvolání proti tomuto opatření můžete podat do 6 měsíců od doručení tohoto oznámení: ${params.dsaUrl}`,
    OPERATOR_CONTACT_EMAIL
      ? `Kontakt provozovatele: ${OPERATOR_CONTACT_EMAIL}`
      : null,
  ].filter(Boolean);

  const text = `Dobrý den${params.nickname ? `, ${params.nickname}` : ""},

váš účet na ${SITE_DISPLAY_NAME} byl administrátorem webu smazán.

Důvod:
${reasonLabel}${note ? `\n\nPoznámka moderátora:\n${note}` : ""}

Právní / smluvní základ:
VOP čl. 4 a Pravidla inzerce.

Související dokumentace: ${params.vopUrl}

${appealLines.join("\n")}

---
${SITE_DISPLAY_NAME}
`;

  return {
    subject: `Váš účet na ${SITE_DISPLAY_NAME} byl smazán`,
    text,
  };
}
