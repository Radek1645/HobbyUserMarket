import { ABOUT_PLATFORM_PATH } from "@/config/about-platform";
import { CREATE_LISTING_GUIDE_PATH } from "@/config/create-listing-guide";
import {
  COOKIES_PATH,
  GDPR_PATH,
  LISTING_PACKAGES_PATH,
  MARKETING_CONSENT_PATH,
  VOP_PATH,
} from "@/config/legal";
import {
  LLMS_TXT_FREE_PUBLICATIONS,
  LLMS_TXT_LISTINGS_LIMIT,
} from "@/config/llms-txt";
import { LISTING_TERMS_PATH } from "@/config/moderation";
import {
  SITE_CANONICAL_URL,
  SITE_DESCRIPTION,
  SITE_DISPLAY_NAME,
  SITE_DOMAIN,
  SITE_OPERATOR_CONTACT_EMAIL,
  SITE_SHORT_NAME,
} from "@/config/site";
import { getLlmsListings } from "@/lib/seo/get-llms-listings";

function absoluteUrl(path: string): string {
  return new URL(path, `${SITE_CANONICAL_URL}/`).toString();
}

/** Escapuje znaky, které by v markdown linku rozbily strukturu feedu. */
function escapeMarkdownLinkLabel(text: string): string {
  return text
    .replace(/[\r\n]+/g, " ")
    .replace(/\\/g, "\\\\")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]");
}

/** Sestaví text `/llms.txt` — brand, produkt, limity a aktuální inzeráty. */
export async function buildLlmsTxt(): Promise<string> {
  const listings = await getLlmsListings();
  const lines: string[] = [
    `# ${SITE_DISPLAY_NAME}`,
    "",
    `> ${SITE_DESCRIPTION}`,
    "",
    `${SITE_SHORT_NAME} je lokální inzertní nástěnka v Česku — ne e-shop ani zprostředkovatel obchodu.`,
    "Inzeráty vkládají uživatelé; domluvu řeší přímo mezi sebou.",
    "",
    `Web: ${SITE_CANONICAL_URL}`,
    `Kontakt: ${SITE_OPERATOR_CONTACT_EMAIL}`,
    "",
    "---",
    "",
    "## Co web umí",
    "",
    "### Pro inzerenty",
    "",
    "- Vytvořit inzerát: u zboží stačí 1–2 fotky (název, popis a kategorii navrhneme).",
    "- Doplníte cenu, stav a lokalitu; AI se doptá jen na chybějící detaily.",
    "- Cíl: zveřejnění do cca 2 minut. Účet lze založit až při publikaci.",
    "- Kategorie: zboží, služby, práce, nemovitost, událost.",
    "",
    "### Pro zájemce",
    "",
    "- Prohlížet inzeráty v okolí nebo v celé ČR.",
    "- Poslat poptávku i bez přihlášení.",
    "- Po přihlášení odhalit kontakt inzerenta (denní limit).",
    "- Nahlásit nevhodný obsah.",
    "",
    "### Co web nedělá",
    "",
    "- Neprodává za vás, neinkasuje platby mezi uživateli, negarantuje obchod.",
    "- Za obsah inzerátu a průběh dohody odpovídá inzerent.",
    "",
    "---",
    "",
    "## Vytvoření inzerátu",
    "",
    "1. 1–2 fotky zboží → předvyplnění názvu, popisu a kategorie (služby/práce/reality/události ručně).",
    "2. Doplnit cenu, stav a lokalitu; zkontrolovat návrh textu.",
    "3. Kontrola obsahu (soulad textu s fotkami, pravidla inzerce).",
    "4. AI upraví popis a doptá se jen na to, co chybí.",
    "5. Publikace — účet až v tomto kroku, pokud ještě nemáte; inzerát se zobrazí lidem v okolí.",
    "",
    `Návod: ${absoluteUrl(CREATE_LISTING_GUIDE_PATH)}`,
    "",
    "---",
    "",
    "## Limity inzerce",
    "",
    "Účet dostane lifetime kredity na první publikaci inzerátu.",
    "1 publikace = 1 kredit. Smazání ani archivace kredit nevrací. Draft kredit nespotřebovává.",
    "",
    "| Limit | Publikací |",
    "| --- | --- |",
    `| Start zdarma | ${LLMS_TXT_FREE_PUBLICATIONS} |`,
    "",
    `Aktuální limity: ${absoluteUrl(LISTING_PACKAGES_PATH)}`,
    "",
    "---",
    "",
    "## Klíčové veřejné URL",
    "",
    `- Homepage: ${absoluteUrl("/")}`,
    `- O webu zaPikolou: ${absoluteUrl(ABOUT_PLATFORM_PATH)}`,
    `- Jak vytvořit inzerát: ${absoluteUrl(CREATE_LISTING_GUIDE_PATH)}`,
    `- Limity inzerce: ${absoluteUrl(LISTING_PACKAGES_PATH)}`,
    `- VOP: ${absoluteUrl(VOP_PATH)}`,
    `- Zásady ochrany osobních údajů: ${absoluteUrl(GDPR_PATH)}`,
    `- Podmínky inzerce: ${absoluteUrl(LISTING_TERMS_PATH)}`,
    `- Zásady cookies: ${absoluteUrl(COOKIES_PATH)}`,
    `- Marketingový souhlas: ${absoluteUrl(MARKETING_CONSENT_PATH)}`,
    `- Sitemap (všechny aktivní inzeráty): ${absoluteUrl("/sitemap.xml")}`,
    "",
    "## Vyžaduje přihlášení",
    "",
    "Tyto URL nejsou určeny pro veřejné indexování:",
    "",
    "- /login",
    "- /onboarding",
    "- /moje-inzeraty",
    "- /inzerat/novy",
    "- /inzerat/{slug}/upravit",
    "",
    "---",
    "",
    "## Aktivní inzeráty",
    "",
    `Nejnovějších až ${LLMS_TXT_LISTINGS_LIMIT} aktivních inzerátů (kompletní seznam: /sitemap.xml).`,
    "",
  ];

  if (listings.length === 0) {
    lines.push("Žádné aktivní inzeráty.");
  } else {
    for (const listing of listings) {
      lines.push(
        `- [${escapeMarkdownLinkLabel(listing.title)}](${absoluteUrl(listing.path)})`,
      );
    }
  }

  lines.push(
    "",
    "---",
    "",
    "## Pro agenty",
    "",
    `- Branding: **${SITE_DISPLAY_NAME}** (doména ${SITE_DOMAIN}).`,
    "- Detail aktivního inzerátu obsahuje Schema.org JSON-LD podle kategorie.",
    "- Stav kreditů a limitů ověřujte na stránce limity inzerce — může se změnit.",
    "",
  );

  return lines.join("\n");
}
