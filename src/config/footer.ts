import {
  ABOUT_PLATFORM_PATH,
  ABOUT_PLATFORM_UI,
} from "@/config/about-platform";
import {
  CREATE_LISTING_GUIDE_PATH,
  CREATE_LISTING_GUIDE_UI,
} from "@/config/create-listing-guide";
import {
  COOKIES_PATH,
  LEGAL_UI,
  LISTING_PACKAGES_PATH,
  MARKETING_CONSENT_PATH,
  VOP_PATH,
} from "@/config/legal";
import { LLMS_TXT_PATH, LLMS_TXT_UI } from "@/config/llms-txt";
import {
  LISTING_TERMS_PATH,
  MODERATION_REJECTION_UI,
} from "@/config/moderation";
import { REPORT_UI } from "@/config/reports";
import {
  SITE_DISPLAY_NAME,
  SITE_OPERATOR_CONTACT_EMAIL,
  SITE_OPERATOR_DATA_BOX_ID,
  SITE_OPERATOR_NAME,
} from "@/config/site";

/** Patička — cesty a popisky sloupců. */
export const KONTAKT_PATH = "/kontakt";

export const FOOTER_UI = {
  documentsHeading: "Dokumenty",
  contactHeading: "Kontakt",
  aboutHeading: "Co je zaPikolou?",
  tagline: "lokální inzerce ve vašem okolí",
  contactLinkLabel: "Provozovatel webu",
} as const;

export const FOOTER_DOCUMENT_LINKS = [
  { href: VOP_PATH, label: LEGAL_UI.vopLinkLabel },
  { href: LISTING_TERMS_PATH, label: MODERATION_REJECTION_UI.termsLinkLabel },
  { href: COOKIES_PATH, label: LEGAL_UI.cookiesLinkLabel },
  { href: MARKETING_CONSENT_PATH, label: LEGAL_UI.marketingConsentLinkLabel },
  { href: LISTING_PACKAGES_PATH, label: LEGAL_UI.listingPackagesLinkLabel },
  { href: "/nahlasit", label: REPORT_UI.footerLinkLabel },
] as const;

export const FOOTER_CONTACT_LINKS = [
  { href: KONTAKT_PATH, label: FOOTER_UI.contactLinkLabel },
] as const;

export const FOOTER_ABOUT_LINKS = [
  {
    href: ABOUT_PLATFORM_PATH,
    label: ABOUT_PLATFORM_UI.footerLinkLabel,
  },
  {
    href: CREATE_LISTING_GUIDE_PATH,
    label: CREATE_LISTING_GUIDE_UI.footerLinkLabel,
  },
  {
    href: LLMS_TXT_PATH,
    label: LLMS_TXT_UI.footerLinkLabel,
  },
] as const;

export const KONTAKT_PAGE_UI = {
  metaTitle: `Provozovatel webu | ${SITE_DISPLAY_NAME}`,
  metaDescription: `Provozovatel ${SITE_DISPLAY_NAME} — ${SITE_OPERATOR_NAME}, fyzická osoba. E-mail ${SITE_OPERATOR_CONTACT_EMAIL}, datová schránka ${SITE_OPERATOR_DATA_BOX_ID}.`,
  pageTitle: "Provozovatel webu",
  providerHeading: "Provozovatel",
  providerName: SITE_OPERATOR_NAME,
  providerLegalForm: "fyzická osoba",
  emailLabel: "E-mail",
  dataBoxLabel: "Datová schránka",
  dataBoxId: SITE_OPERATOR_DATA_BOX_ID,
  responseHint:
    "Na e-mail odpovídáme obvykle do několika pracovních dnů. Pro nahlášení nelegálního inzerátu použijte formulář Nahlásit inzerát v patičce.",
} as const;
