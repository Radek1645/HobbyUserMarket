/** Nahradí e-mail, telefon a české SPZ v textu — PRD §5.4 / prefill pojistka. */
const CONTACT_PLACEHOLDER = "[SKRYTO – použij chráněné pole]";
const PLATE_PLACEHOLDER = "[SKRYTO]";

const EMAIL_PATTERN =
  /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;

/**
 * České telefony — nesmí zachytit formátovanou cenu (např. „1 536 380 Kč“).
 * Mobil 6xx/7xx, pevná linka 2xx–5xx, volitelně +420.
 */
const PHONE_PATTERN =
  /(?:\+420[\s.-]?)?(?:[67]\d{2}|[2-5]\d{2})[\s.-]?\d{3}[\s.-]?\d{3}\b/g;

/**
 * Česká SPZ (forma od 2001): 1AB 2345 / 1TL9939.
 * Konzervativní — vyžaduje číslici + 2 písmena + 4 číslice (ne samotný rok).
 */
const CZ_LICENSE_PLATE_MODERN_PATTERN = /\b\d[A-Z]{2}\s?\d{4}\b/gi;

/** Starší / diplomatické tvary typu AB 12-34, A 12345 — jen s mezerou/pomlčkou. */
const CZ_LICENSE_PLATE_ALT_PATTERN =
  /\b[A-Z]{1,2}\s?\d{1,2}[-\s]\d{2,4}\b/g;

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
    .replace(PHONE_PATTERN, CONTACT_PLACEHOLDER)
    .replace(CZ_LICENSE_PLATE_MODERN_PATTERN, PLATE_PLACEHOLDER)
    .replace(CZ_LICENSE_PLATE_ALT_PATTERN, PLATE_PLACEHOLDER);

  return stripped.replace(
    new RegExp(`${PRICE_TOKEN_PREFIX}(\\d+)\uE000`, "g"),
    (_, index) => saved[Number(index)] ?? "",
  );
}
