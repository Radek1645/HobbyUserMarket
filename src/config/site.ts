/** Veřejný branding platformy — UI, metadata, e-maily. */

export const SITE_DISPLAY_NAME = "zaPikolou.cz";

export const SITE_SHORT_NAME = "zaPikolou";

export const SITE_DOMAIN = "zapikolou.cz";

/** Veřejná kanonická URL (sitemap/llms/SEO) — nezávislá na localhost fallbacku. */
export const SITE_CANONICAL_URL = `https://${SITE_DOMAIN}`;

/** Výchozí kontakt provozovatele — env v produkci přepíše stejnou hodnotou. */
export const SITE_OPERATOR_CONTACT_EMAIL = `info@${SITE_DOMAIN}`;

/** Jméno provozovatele — sync s docs/pravni/*-fo.md. */
export const SITE_OPERATOR_NAME = "Radek Horák";

/**
 * Označení dle výpisu z živnostenského rejstříku — stránka `/kontakt`.
 * Titul je na výpisu; FO právní texty dál používají `SITE_OPERATOR_NAME`.
 */
export const SITE_OPERATOR_REGISTERED_NAME = "Bc. Radek Horák";

/** IČO provozovatele (živnost od 26. 8. 2026). */
export const SITE_OPERATOR_ICO = "29956803";

/** Sídlo podnikání dle výpisu z živnostenského rejstříku. */
export const SITE_OPERATOR_REGISTERED_OFFICE =
  "Palackého třída 2509/147, 612 00 Brno - Královo Pole";

export const SITE_OPERATOR_REGISTERED_OFFICE_PARTS = {
  streetAddress: "Palackého třída 2509/147",
  postalCode: "612 00",
  addressLocality: "Brno - Královo Pole",
  addressCountry: "CZ",
} as const;

/** ID datové schránky provozovatele — sync s docs/pravni/*-fo.md. */
export const SITE_OPERATOR_DATA_BOX_ID = "8q4nyyt";

export const SITE_DESCRIPTION =
  "Inzeráty a bazar pro všechny. Lokální inzerce ve vašem okolí — zboží, služby, práce, nemovitosti i události. Stačí fotka a pár kliků, AI se postará o zbytek.";

/** Krátký claim u loga v hlavičce. */
export const SITE_TAGLINE = "Inzeráty a bazar pro všechny";

/** SEO title homepage — klíčová slova + značka (vzor Bazoš/Sbazar). */
export const SITE_SEO_TITLE = `${SITE_TAGLINE} | ${SITE_DISPLAY_NAME}`;

export const SITE_HOME_ARIA_LABEL = `${SITE_DISPLAY_NAME} — ${SITE_TAGLINE}`;

/** Veřejná verze platformy (zobrazená v patičce). */
export const SITE_VERSION = "0.2";

/** Rok v patičce — aktuálnost platformy. */
export const SITE_YEAR = 2026;
