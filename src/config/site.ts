/** Veřejný branding platformy — UI, metadata, e-maily. */

export const SITE_DISPLAY_NAME = "zaPikolou.cz";

export const SITE_SHORT_NAME = "zaPikolou";

export const SITE_DOMAIN = "zapikolou.cz";

/** Výchozí kontakt provozovatele — env v produkci přepíše stejnou hodnotou. */
export const SITE_OPERATOR_CONTACT_EMAIL = `info@${SITE_DOMAIN}`;

/** Jméno provozovatele — sync s docs/pravni/*-fo.md. */
export const SITE_OPERATOR_NAME = "Radek Horák";

/** ID datové schránky provozovatele — sync s docs/pravni/*-fo.md. */
export const SITE_OPERATOR_DATA_BOX_ID = "fxetq2k";

export const SITE_DESCRIPTION =
  "Online bazar a inzerce ve vašem okolí. AI se doptá na detaily a vytvoří inzerát do 2 minut — zboží, služby, práce i nemovitosti.";

/** SEO title homepage — klíčová slova + značka (vzor Bazoš/Sbazar). */
export const SITE_SEO_TITLE = `Inzerce, inzeráty, online bazar | ${SITE_DISPLAY_NAME}`;

export const SITE_HOME_ARIA_LABEL = `${SITE_DISPLAY_NAME} — úvodní stránka`;

/** Veřejná verze platformy (zobrazená v patičce). */
export const SITE_VERSION = "0.1";
