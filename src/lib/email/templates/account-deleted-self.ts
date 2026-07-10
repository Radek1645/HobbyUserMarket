type BuildAccountSelfDeletedEmailParams = {
  nickname: string;
};

export function buildAccountSelfDeletedEmail(
  params: BuildAccountSelfDeletedEmailParams,
): { subject: string; text: string } {
  const text = `Dobrý den${params.nickname ? `, ${params.nickname}` : ""},

potvrzujeme, že váš účet na HobbyUserMarket byl na vaši žádost trvale smazán.

Aktivní inzeráty byly odstraněny. Komentáře pod cizími inzeráty zůstávají anonymizované jako „[smazaný účet]".

Pokud jste o smazání nežádali, kontaktujte nás co nejdříve.

---
HobbyUserMarket
`;

  return {
    subject: "Potvrzení smazání účtu HobbyUserMarket",
    text,
  };
}
