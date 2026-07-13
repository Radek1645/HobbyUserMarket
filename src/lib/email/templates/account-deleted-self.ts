import { SITE_DISPLAY_NAME } from "@/config/site";

type BuildAccountSelfDeletedEmailParams = {
  nickname: string;
};

export function buildAccountSelfDeletedEmail(
  params: BuildAccountSelfDeletedEmailParams,
): { subject: string; text: string } {
  const text = `Dobrý den${params.nickname ? `, ${params.nickname}` : ""},

potvrzujeme, že váš účet na ${SITE_DISPLAY_NAME} byl na vaši žádost trvale smazán.

Aktivní inzeráty byly odstraněny. Komentáře pod cizími inzeráty zůstávají anonymizované jako „[smazaný účet]".

Pokud jste o smazání nežádali, kontaktujte nás co nejdříve.

---
${SITE_DISPLAY_NAME}
`;

  return {
    subject: `Potvrzení smazání účtu ${SITE_DISPLAY_NAME}`,
    text,
  };
}
