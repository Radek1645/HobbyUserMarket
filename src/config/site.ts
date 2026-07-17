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

/** ID datové schránky provozovatele — sync s docs/pravni/*-fo.md. */
export const SITE_OPERATOR_DATA_BOX_ID = "fxetq2k";

export const SITE_DESCRIPTION =
  "Inzeráty a bazar pro všechny. Lokální inzerce ve vašem okolí — zboží, služby, práce, nemovitosti i události. AI vytvoří inzerát do 2 minut.";

/** Krátký claim u loga v hlavičce. */
export const SITE_TAGLINE = "Inzeráty a bazar pro všechny";

/** SEO title homepage — klíčová slova + značka (vzor Bazoš/Sbazar). */
export const SITE_SEO_TITLE = `${SITE_TAGLINE} | ${SITE_DISPLAY_NAME}`;

export const SITE_HOME_ARIA_LABEL = `${SITE_DISPLAY_NAME} — úvodní stránka`;

/** Veřejná verze platformy (zobrazená v patičce). */
export const SITE_VERSION = "0.1";
