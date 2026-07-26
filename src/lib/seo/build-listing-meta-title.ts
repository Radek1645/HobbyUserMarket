import {
  LISTING_META_TITLE_BRAND,
  LISTING_META_TITLE_MAX_LENGTH,
} from "@/config/listing-seo";

const MIN_H1_CHARS_IN_META = 12;

function joinMetaTitle(
  h1: string,
  locality: string | null,
  brand: string | null,
): string {
  let result = h1;
  if (locality) result += ` – ${locality}`;
  if (brand) result += ` | ${brand}`;
  return result;
}

/**
 * Zkrátí H1 do rozpočtu — na hranici slov, ne uprostřed čísla (60 x 50 → ne „60 x 5“).
 */
export function shortenH1ForMetaTitle(title: string, budget: number): string {
  const trimmed = title.trim();
  if (budget <= 0) return "";
  if (trimmed.length <= budget) return trimmed;

  let cut = trimmed.slice(0, budget);
  const nextChar = trimmed[budget] ?? "";

  // Řez uprostřed tokenu → zpět na poslední mezeru.
  if (nextChar && !/\s/.test(nextChar) && !/\s/.test(cut.at(-1) ?? " ")) {
    const lastSpace = cut.lastIndexOf(" ");
    if (lastSpace >= MIN_H1_CHARS_IN_META) {
      cut = cut.slice(0, lastSpace);
    }
  }
  cut = cut.trimEnd();

  // „60 x 5“ z „60 x 50“ — když originál pokračuje číslicí, odstraň useknuté číslo.
  if (nextChar && /\d/.test(nextChar)) {
    cut = cut.replace(/\s+\d+\s*$/, "").trimEnd();
  }

  // Visící „60 x“ / „60 ×“
  cut = cut.replace(/\s+\d+\s*[x×]\s*$/i, "").trimEnd();

  if (cut.length < MIN_H1_CHARS_IN_META) {
    return trimmed.slice(0, budget).trimEnd();
  }
  return cut;
}

/**
 * Sestaví `<title>` inzerátu dle SEO bible §3.2.
 * Preferuje lokalitu (+ brand): při přetečení nejdřív zkrátí H1 zprava,
 * teprve pak vynechá brand, pak lokalitu (lokalita > brand > specifikace H1).
 * `locality` má být obec/město — ne ulice.
 */
export function buildListingMetaTitle(
  h1: string,
  locality: string,
  maxLength: number = LISTING_META_TITLE_MAX_LENGTH,
): string {
  const title = h1.trim();
  const place = locality.trim();
  const brand = LISTING_META_TITLE_BRAND;

  if (!title) {
    return brand.slice(0, maxLength);
  }

  const variants: Array<{ place: string | null; brand: string | null }> = [
    { place: place || null, brand },
    { place: place || null, brand: null },
    { place: null, brand },
    { place: null, brand: null },
  ];

  for (const variant of variants) {
    const full = joinMetaTitle(title, variant.place, variant.brand);
    if (full.length <= maxLength) return full;

    const suffix = joinMetaTitle("", variant.place, variant.brand);
    const budget = maxLength - suffix.length;
    if (budget < MIN_H1_CHARS_IN_META) continue;

    const shortened = shortenH1ForMetaTitle(title, budget);
    if (shortened.length < MIN_H1_CHARS_IN_META) continue;

    return joinMetaTitle(shortened, variant.place, variant.brand);
  }

  return shortenH1ForMetaTitle(title, maxLength);
}
