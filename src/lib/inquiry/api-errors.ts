/** Uživatelské hlášky — PRD §1.6; bez technických detailů (M5/P17). */
export const INQUIRY_GENERIC_ERROR =
  "Zprávu se nepodařilo odeslat. Zkontrolujte zadání nebo to zkuste později.";

export const INQUIRY_RATE_LIMIT_IP_ERROR =
  "Denní limit odeslaných zpráv je vyčerpaný. Zkuste to prosím zítra.";

export const INQUIRY_RATE_LIMIT_POST_ERROR =
  "Na tento inzerát jste dnes odeslali příliš mnoho zpráv. Zkuste to prosím zítra.";

export const INQUIRY_UNAVAILABLE_ERROR = "Kontakt zadavatele není k dispozici.";

export const INQUIRY_SERVICE_UNAVAILABLE_ERROR =
  "Služba pro odesílání zpráv není momentálně k dispozici. Zkuste to prosím později.";

export const INQUIRY_HONEYPOT_ERROR = "Neplatný požadavek.";

/** SEC-M02 / GO-6 — prostý form POST bez JSON. */
export const INQUIRY_UNSUPPORTED_MEDIA_TYPE_ERROR = "Neplatný požadavek.";

/** SEC-M02 / GO-6 — Origin mimo whitelist (cross-site z prohlížeče). */
export const INQUIRY_FORBIDDEN_ORIGIN_ERROR = "Neplatný požadavek.";

