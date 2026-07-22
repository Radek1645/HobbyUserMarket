import {
  SITE_DISPLAY_NAME,
  SITE_OPERATOR_CONTACT_EMAIL,
} from "@/config/site";
import type { AccountBlacklistSource } from "@/config/account-blacklist";

type BuildAccountHardStopEmailParams = {
  suspendedPageUrl: string;
  vopUrl: string;
  dsaUrl: string;
  source: AccountBlacklistSource;
  reason: string;
};

function sourceLabel(source: AccountBlacklistSource): string {
  return source === "automatic"
    ? "automaticky po opakovaném porušení podmínek inzerce (3 zamítnutí během 24 hodin)"
    : "rozhodnutím moderátora platformy";
}

export function buildAccountHardStopEmail(
  params: BuildAccountHardStopEmailParams,
): { subject: string; text: string } {
  const reasonLine = params.reason.trim()
    ? `\nTechnický / interní důvod: ${params.reason.trim()}\n`
    : "\n";

  const text = `Dobrý den,

váš účet na ${SITE_DISPLAY_NAME} byl pozastaven (${sourceLabel(params.source)}).

Co to znamená:
- Nemůžete zakládat ani upravovat inzeráty.
- Vaše veřejné inzeráty byly skryty.
- Po přihlášení uvidíte stránku s informacemi o pozastavení: ${params.suspendedPageUrl}
${reasonLine}
Právní / smluvní základ:
VOP (§4.5 Hard stop — CSAM a závažné zneužití) a Pravidla inzerce (§2.4).

Pokud jde o omyl, napište nám na ${SITE_OPERATOR_CONTACT_EMAIL} nebo použijte stížnost dle DSA:
${params.dsaUrl}

Související dokumentace: ${params.vopUrl}

---
${SITE_DISPLAY_NAME}
`;

  return {
    subject: `Účet na ${SITE_DISPLAY_NAME} byl pozastaven`,
    text,
  };
}
