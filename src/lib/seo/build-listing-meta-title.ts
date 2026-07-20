import {
  LISTING_META_TITLE_BRAND,
  LISTING_META_TITLE_MAX_LENGTH,
} from "@/config/listing-seo";

/**
 * Sestaví `<title>` inzerátu dle SEO bible §3.2.
 * Truncace: 1) brand, 2) lokalita, 3) H1 zprava.
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

  const withAll = place
    ? `${title} – ${place} | ${brand}`
    : `${title} | ${brand}`;
  if (withAll.length <= maxLength) return withAll;

  const withoutBrand = place ? `${title} – ${place}` : title;
  if (withoutBrand.length <= maxLength) return withoutBrand;

  if (title.length <= maxLength) return title;

  return title.slice(0, maxLength).trimEnd();
}
