/** SEO limity a verze bible — sync s docs/seo/SEO_BIBLE.md. */

import { SITE_DISPLAY_NAME } from "@/config/site";

/** Musí odpovídat hlavičce Verze v docs/seo/SEO_BIBLE.md. */
export const LISTING_SEO_BIBLE_VERSION = "1.3";

/**
 * Cílová max. délka H1 / cleanedTitle (AI).
 * Má být kratší než meta title — v `<title>` musí zůstat prostor pro lokalitu a brand.
 */
export const LISTING_H1_SEO_MAX_LENGTH = 45;

/** Max. délka document title / OG title po buildListingMetaTitle. */
export const LISTING_META_TITLE_MAX_LENGTH = 60;

/** Cílová délka meta description (AI). */
export const LISTING_META_DESCRIPTION_MIN_LENGTH = 150;
export const LISTING_META_DESCRIPTION_MAX_LENGTH = 160;

/** Max. délka alt textu hlavní fotky. */
export const LISTING_IMAGE_ALT_MAX_LENGTH = 125;

/** Brand suffix v meta title (před truncací). */
export const LISTING_META_TITLE_BRAND = SITE_DISPLAY_NAME;
