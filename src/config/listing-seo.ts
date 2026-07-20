/** SEO limity a verze bible — sync s docs/seo/SEO_BIBLE.md. */

import { SITE_DISPLAY_NAME } from "@/config/site";

/** Musí odpovídat hlavičce Verze v docs/seo/SEO_BIBLE.md. */
export const LISTING_SEO_BIBLE_VERSION = "1.7";

/**
 * Cílová max. délka H1 / cleanedTitle (AI).
 * Má být kratší než meta title — v `<title>` musí zůstat prostor pro lokalitu a brand.
 */
export const LISTING_H1_SEO_MAX_LENGTH = 45;

/** Max. délka document title / OG title po buildListingMetaTitle. */
export const LISTING_META_TITLE_MAX_LENGTH = 60;

/**
 * Soft cíl délky meta description pro AI (ideál).
 * Storage / SERP strop je LISTING_META_DESCRIPTION_MAX_LENGTH — delší text se ořízne, nezamítne.
 */
export const LISTING_META_DESCRIPTION_SOFT_MIN = 150;
export const LISTING_META_DESCRIPTION_SOFT_MAX = 160;
/** AI smí přestřelit; platforma clampne na MAX_LENGTH. */
export const LISTING_META_DESCRIPTION_AI_SOFT_CEILING = 200;

/** Hard cap pro DB / `<meta name="description">`. */
export const LISTING_META_DESCRIPTION_MAX_LENGTH = 160;

/** @deprecated Použij LISTING_META_DESCRIPTION_SOFT_MIN — alias pro pad krátkých textů. */
export const LISTING_META_DESCRIPTION_MIN_LENGTH =
  LISTING_META_DESCRIPTION_SOFT_MIN;

/** Max. délka alt textu hlavní fotky (po clamp). */
export const LISTING_IMAGE_ALT_MAX_LENGTH = 125;

/** Brand suffix v meta title (před truncací). */
export const LISTING_META_TITLE_BRAND = SITE_DISPLAY_NAME;
