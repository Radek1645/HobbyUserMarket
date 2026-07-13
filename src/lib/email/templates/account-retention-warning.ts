import { SITE_DISPLAY_NAME } from "@/config/site";

type BuildAccountRetentionWarningEmailParams = {
  nickname: string;
  loginUrl: string;
  deleteInDays: number;
};

export function buildAccountRetentionWarningEmail(
  params: BuildAccountRetentionWarningEmailParams,
): { subject: string; text: string } {
  const text = `Dobrý den${params.nickname ? `, ${params.nickname}` : ""},

váš účet na ${SITE_DISPLAY_NAME} je dlouhodobě neaktivní.

Pokud se do ${params.deleteInDays} dní nepřihlásíte, účet automaticky anonymizujeme a smažeme (GDPR minimalizace údajů).

Stačí se přihlásit:
${params.loginUrl}

---
${SITE_DISPLAY_NAME}
`;

  return {
    subject: `Upozornění: váš účet na ${SITE_DISPLAY_NAME} bude brzy smazán`,
    text,
  };
}

