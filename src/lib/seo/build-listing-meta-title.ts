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
 * Sestaví `<title>` inzerátu dle SEO bible §3.2.
 * Preferuje lokalitu (+ brand): při přetečení nejdřív zkrátí H1 zprava,
 * teprve pak vynechá brand, pak lokalitu (lokalita > brand > specifikace H1).
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

    const shortened = title.slice(0, budget).trimEnd();
    if (shortened.length < MIN_H1_CHARS_IN_META) continue;

    return joinMetaTitle(shortened, variant.place, variant.brand);
  }

  return title.slice(0, maxLength).trimEnd();
}
