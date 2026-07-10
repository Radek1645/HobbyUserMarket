/** Právní dokumenty — cesty a popisky (PRD §5.2, §11.3). */

export const VOP_PATH = "/vop";
export const LISTING_PACKAGES_PATH = "/balicky-inzerce";
export const MARKETING_CONSENT_PATH = "/marketingovy-souhlas";
export const DSA_CONTACT_PATH = "/dsa";

export const LEGAL_UI = {
  vopLinkLabel: "Všeobecné obchodní podmínky",
  listingPackagesLinkLabel: "Balíčky inzerce",
  marketingConsentLinkLabel: "Marketingový souhlas",
  registrationVopConsent:
    "Souhlasím s všeobecnými obchodními podmínkami. Bez tohoto souhlasu účet nezaložíme.",
  registrationMarketingConsent:
    "Souhlasím se zasíláním novinek a tipů e-mailem. Souhlas můžete kdykoli odvolat.",
  registrationAgeConsent:
    "Prohlašuji, že mi je alespoň 15 let. V případě věku 15–18 let mám k této činnosti souhlas zákonného zástupce, je-li vyžadován.",
  registrationAgeConsentError:
    "Pro založení účtu je nutné potvrdit, že vám je alespoň 15 let.",
} as const;
