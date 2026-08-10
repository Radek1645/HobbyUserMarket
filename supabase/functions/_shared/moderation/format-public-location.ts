/** Auto-synced from src/lib/posts/format-public-location.ts — do not edit. */
/**
 * Veřejná lokalita inzerátu.
 * - událost / nemovitost: ulice bez popisného čísla + obec
 * - ostatní (zboží, služby, práce): jen obec / městská část
 * Plná adresa zůstává v `posts.location_text` (DB, majitel, formulář).
 *
 * Stejná logika jde do Edge (`sync:moderation` → `_shared/moderation/`).
 * `categoryType` je string, aby šel soubor zkopírovat bez `@/types`.
 */

const CITY_SUFFIX = /\s*-\s*město$/i;

/** Odstraní popisné/orientační číslo z ulice. */
const CZECH_HOUSE_NUMBER_SUFFIX =
  /\s+(?:č\.?\s*)?\d+[a-zA-Z]?(?:\s*\/\s*\d+[a-zA-Z]?)?$/;

const CATEGORIES_WITH_PUBLIC_STREET = new Set([
  "udalost",
  "nemovitost",
]);

function stripCitySuffix(value: string): string {
  return value.replace(CITY_SUFFIX, "").trim();
}

/** Obec / městská část — typicky poslední segment po čárce. */
function formatMunicipalityLocation(locationText: string): string {
  const trimmed = locationText.trim();
  if (!trimmed) return trimmed;

  const parts = trimmed
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 2) {
    return stripCitySuffix(parts[parts.length - 1]!);
  }

  return stripCitySuffix(trimmed);
}

/** Ulice bez čísla popisného + zbytek (obec…). */
function formatStreetAreaLocation(locationText: string): string {
  const trimmed = locationText.trim();
  if (!trimmed) return trimmed;

  if (!trimmed.includes(",")) {
    return trimmed.replace(CZECH_HOUSE_NUMBER_SUFFIX, "").trim();
  }

  const [first, ...rest] = trimmed.split(",").map((part) => part.trim());
  const street = first.replace(CZECH_HOUSE_NUMBER_SUFFIX, "").trim();
  const tail = rest.filter(Boolean).join(", ");

  if (!street) return tail || trimmed;
  if (!tail) return street;
  return `${street}, ${tail}`;
}

/**
 * Veřejný štítek lokality podle kategorie.
 * Bez `categoryType` (visitor poloha apod.) = jen obec/město.
 */
export function formatPublicListingLocation(
  locationText: string,
  categoryType?: string,
): string {
  if (categoryType && CATEGORIES_WITH_PUBLIC_STREET.has(categoryType)) {
    return formatStreetAreaLocation(locationText);
  }
  return formatMunicipalityLocation(locationText);
}

/** Kompaktní štítek do headeru — vždy obec/město. */
export function formatHeaderLocation(locationText: string): string {
  return formatMunicipalityLocation(locationText);
}

/**
 * Lokalita do `<title>` / meta — vždy obec/město (ne ulice).
 */
export function formatMetaTitleLocality(locationText: string): string {
  return formatMunicipalityLocation(locationText);
}
