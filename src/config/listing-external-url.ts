/** Copy validace volitelného odkazu u události. */

export const EXTERNAL_URL_FIELD_UI = {
  required:
    "Zadejte odkaz na web nebo sociální síť, nebo políčko vypněte.",
  invalid: "Zadejte platný odkaz (např. https://facebook.com/…).",
  httpsRequired: "Odkaz musí začínat https://.",
  noCredentials: "Odkaz nesmí obsahovat přihlašovací údaje.",
  publicHost: "Zadejte odkaz na veřejný web nebo sociální síť.",
  noSpaces: "Vložte jen jeden odkaz, bez mezer a dalšího textu.",
  noIp: "Zadejte odkaz na web (ne IP adresu).",
  adultBlocked: "Odkaz na erotický nebo pornografický web není povolen.",
  tooLong: (maxLength: number) =>
    `Odkaz může mít maximálně ${maxLength} znaků.`,
} as const;

/** Adult TLD — celý hostname padá. */
export const BLOCKED_ADULT_TLDS = new Set(["xxx", "sex", "adult", "porn"]);

/**
 * Praktický denylist tube/cam platforem (label v hostname).
 * Není encyklopedie — doplňuje heuristiku `porn` / `xxx` v labelu.
 */
export const BLOCKED_ADULT_HOST_LABELS = new Set([
  "pornhub",
  "pornhubpremium",
  "xvideos",
  "xnxx",
  "xhamster",
  "youporn",
  "redtube",
  "tube8",
  "spankbang",
  "eporner",
  "tnaflix",
  "beeg",
  "youjizz",
  "pornone",
  "chaturbate",
  "stripchat",
  "onlyfans",
  "fansly",
  "manyvids",
  "nhentai",
  "hanime",
  "rule34",
  "fapello",
  "motherless",
]);
