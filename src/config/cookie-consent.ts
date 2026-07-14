import { COOKIES_PATH } from "@/config/legal";

/** Verze schéma souhlasu — bump při změně kategorií nebo právního textu. */
export const COOKIE_CONSENT_SCHEMA_VERSION = 1;

export const COOKIE_CONSENT_STORAGE_KEY = `cookie-consent:v${COOKIE_CONSENT_SCHEMA_VERSION}`;

/** Synchronizuje výšku banneru pro posun FAB nad lištu (CreateListingFab). */
export const COOKIE_CONSENT_BANNER_HEIGHT_CSS_VAR = "--cookie-consent-banner-height";

export const COOKIE_CONSENT_UI = {
  bannerTitle: "Soubory cookie",
  bannerDescription:
    "Technické cookies pro provoz webu. Analytické cookies zapneme jen s vaším souhlasem.",
  acceptAnalyticsLabel: "Přijmout",
  acceptAnalyticsLabelMobile: "Přijmout",
  rejectOptionalLabel: "Pouze nezbytné",
  rejectOptionalLabelMobile: "Nezbytné",
  cookiesPolicyLinkLabel: "Zásady cookies",
  footerSettingsLabel: "Nastavení cookies",
  bannerAriaLabel: "Volba souborů cookie",
} as const;

export const COOKIE_CONSENT_LINKS = {
  cookiesPolicy: { href: COOKIES_PATH, label: COOKIE_CONSENT_UI.cookiesPolicyLinkLabel },
} as const;
