import { MONETIZATION_ENABLED } from "@/config/monetization";

/** Právní dokumenty — cesty a popisky (PRD §5.2, §11.3). */

export const VOP_PATH = "/vop";
export const GDPR_PATH = "/gdpr";
export const LISTING_PACKAGES_PATH = "/balicky-inzerce";
export const MARKETING_CONSENT_PATH = "/marketingovy-souhlas";
export const COOKIES_PATH = "/cookies";
export const DSA_CONTACT_PATH = "/dsa";
export const REPORT_LISTING_PATH = "/nahlasit";

/** Verze VOP v okamžiku registrace — sync s docs/pravni/vop-*.md. */
export const CURRENT_VOP_VERSION = MONETIZATION_ENABLED ? "1.5-osvc" : "1.5-fo";

export const SAFETY_UI = {
  /** Fallback / zboží, móda, služby — osobní předání věci. */
  meetingSafetyNotice:
    "Při osobním předání se domlouvejte na veřejném místě. Pokud vám je méně než 18 let, doporučujeme setkání v doprovodu dospělé osoby.",
  meetingSafetyNoticeByCategory: {
    auto:
      "Při osobním předání se domlouvejte na veřejném místě. Pokud vám je méně než 18 let, doporučujeme setkání v doprovodu dospělé osoby.",
    detsky:
      "Při osobním předání se domlouvejte na veřejném místě. Pokud vám je méně než 18 let, doporučujeme setkání v doprovodu dospělé osoby.",
    dum:
      "Při osobním předání se domlouvejte na veřejném místě. Pokud vám je méně než 18 let, doporučujeme setkání v doprovodu dospělé osoby.",
    elektro:
      "Při osobním předání se domlouvejte na veřejném místě. Pokud vám je méně než 18 let, doporučujeme setkání v doprovodu dospělé osoby.",
    moda:
      "Při osobním předání se domlouvejte na veřejném místě. Pokud vám je méně než 18 let, doporučujeme setkání v doprovodu dospělé osoby.",
    sport:
      "Při osobním předání se domlouvejte na veřejném místě. Pokud vám je méně než 18 let, doporučujeme setkání v doprovodu dospělé osoby.",
    hobby:
      "Při osobním předání se domlouvejte na veřejném místě. Pokud vám je méně než 18 let, doporučujeme setkání v doprovodu dospělé osoby.",
    ostatni:
      "Při osobním předání se domlouvejte na veřejném místě. Pokud vám je méně než 18 let, doporučujeme setkání v doprovodu dospělé osoby.",
    sluzby:
      "Při osobním předání se domlouvejte na veřejném místě. Pokud vám je méně než 18 let, doporučujeme setkání v doprovodu dospělé osoby.",
    udalost:
      "Na srazu / místě konání buďte opatrní. Pokud vám je méně než 18 let, doporučujeme účast v doprovodu dospělé osoby.",
    prace:
      "Schůzku k brigádě / práci domlouvejte na veřejném místě. Pokud vám je méně než 18 let, doporučujeme doprovod dospělé osoby.",
    nemovitost:
      "Prohlídku domlouvejte za denního světla a ideálně s doprovodem. Pokud vám je méně než 18 let, doporučujeme doprovod dospělé osoby.",
  },
  realEstateListingNoticeLines: [
    "Jsme jen internetová nástěnka — ne realitka. Z prodeje ani pronájmu nemáme provizi; smlouvu uzavíráte mezi sebou.",
    "Realitní kancelář? V inzerátu uveďte, že jednáte jako firma, a jak je to s provizí.",
    "Pod 18 lety může být k prodeji nebo pronájmu nutný souhlas zákonného zástupce.",
  ],
  jobListingNoticeLines: [
    "Jsme jen internetová nástěnka — ne personální agentura ani zaměstnavatel. Smlouvu uzavíráte mezi sebou; z práce nic nebereme.",
    "Inzerujete jako firma nebo OSVČ? V popisu uveďte, že jednáte jako podnikatel, typ úvazku a formu odměny.",
  ],
} as const;

/** Bezpečnostní tip u kontaktu / poptávky — text podle kategorie inzerátu. */
export function getMeetingSafetyNotice(
  categoryType?: keyof typeof SAFETY_UI.meetingSafetyNoticeByCategory | string | null,
): string {
  if (
    categoryType &&
    Object.prototype.hasOwnProperty.call(
      SAFETY_UI.meetingSafetyNoticeByCategory,
      categoryType,
    )
  ) {
    return SAFETY_UI.meetingSafetyNoticeByCategory[
      categoryType as keyof typeof SAFETY_UI.meetingSafetyNoticeByCategory
    ];
  }
  return SAFETY_UI.meetingSafetyNotice;
}

export const LEGAL_UI = {
  vopLinkLabel: "Všeobecné obchodní podmínky",
  gdprLinkLabel: "Zásady ochrany osobních údajů",
  listingPackagesLinkLabel: MONETIZATION_ENABLED
    ? "Balíčky inzerce"
    : "Limity inzerce",
  marketingConsentLinkLabel: "Marketingový souhlas",
  cookiesLinkLabel: "Zásady cookies",
  dsaLinkLabel: "DSA kontaktní centrum",
  registrationVopConsent:
    "Souhlasím s všeobecnými obchodními podmínkami. Bez tohoto souhlasu účet nezaložíme. (Povinné)",
  registrationMarketingConsent:
    "Souhlasím se zasíláním novinek a tipů e-mailem (až je spustíme). Souhlas můžete kdykoli odvolat.",
  registrationAgeConsent:
    "Prohlašuji, že mi je alespoň 15 let. V případě věku 15–18 let mám k této činnosti souhlas zákonného zástupce, je-li vyžadován. (Povinné)",
  registrationAgeConsentError:
    "Pro založení účtu je nutné potvrdit, že vám je alespoň 15 let.",
} as const;
