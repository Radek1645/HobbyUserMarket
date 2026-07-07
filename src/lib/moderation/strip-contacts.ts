/** Nahradí e-mail a telefon v popisu — PRD §5.4, server-side pojistka. */
const CONTACT_PLACEHOLDER = "[SKRYTO – použij chráněné pole]";

const EMAIL_PATTERN =
  /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;

/**
 * České telefony — nesmí zachytit formátovanou cenu (např. „1 536 380 Kč“).
 * Mobil 6xx/7xx, pevná linka 2xx–5xx, volitelně +420.
 */
const PHONE_PATTERN =
  /(?:\+420[\s.-]?)?(?:[67]\d{2}|[2-5]\d{2})[\s.-]?\d{3}[\s.-]?\d{3}\b/g;

/** Chrání „Cena … Kč“ před falešným zásahem phone regexu. */
const PRICE_PHRASE_PATTERN =
  /\b((?:[Cc]ena|[Oo]rientační cena|[Mm]zda|[Vv]stupné)\s+\d[\d\s]{0,15}\d\s*Kč\.?)/g;

const PRICE_TOKEN_PREFIX = "\uE000PRICE";

export function stripContactInfo(text: string): string {
  const saved: string[] = [];
  const masked = text.replace(PRICE_PHRASE_PATTERN, (match) => {
    const token = `${PRICE_TOKEN_PREFIX}${saved.length}\uE000`;
    saved.push(match);
    return token;
  });

  const stripped = masked
    .replace(EMAIL_PATTERN, CONTACT_PLACEHOLDER)
    .replace(PHONE_PATTERN, CONTACT_PLACEHOLDER);

  return stripped.replace(
    new RegExp(`${PRICE_TOKEN_PREFIX}(\\d+)\uE000`, "g"),
    (_, index) => saved[Number(index)] ?? "",
  );
}
