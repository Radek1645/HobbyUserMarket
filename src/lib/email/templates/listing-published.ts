import { SITE_DISPLAY_NAME } from "@/config/site";

type BuildListingPublishedEmailParams = {
  postTitle: string;
  listingUrl: string;
  myListingsUrl: string;
};

export function buildListingPublishedEmail(
  params: BuildListingPublishedEmailParams,
): { subject: string; text: string } {
  const text = `Dobrý den,

gratulujeme — váš inzerát „${params.postTitle}" je teď zveřejněný na ${SITE_DISPLAY_NAME}.

Poptávky od zájemců vám přijdou na e-mail tohoto účtu.

Odkaz na inzerát:
${params.listingUrl}

Správa inzerátů:
${params.myListingsUrl}

---
${SITE_DISPLAY_NAME}
`;

  return {
    subject: `Váš inzerát je online: ${params.postTitle}`,
    text,
  };
}
