/** Odstraní popisné/orientační číslo z ulice — plná adresa zůstává v DB, zobrazí se jen oblast. */

const CZECH_HOUSE_NUMBER_SUFFIX =
  /\s+(?:č\.?\s*)?\d+[a-zA-Z]?(?:\s*\/\s*\d+[a-zA-Z]?)?$/;

export function formatPublicListingLocation(locationText: string): string {
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
