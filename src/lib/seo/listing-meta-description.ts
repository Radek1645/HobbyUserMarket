import {
  LISTING_META_DESCRIPTION_MAX_LENGTH,
  LISTING_META_DESCRIPTION_MIN_LENGTH,
} from "@/config/listing-seo";
import { SITE_DISPLAY_NAME } from "@/config/site";

/** Úvod popisu před oddělovačem Parametrů (`---`). */
export function extractListingDescriptionIntro(description: string): string {
  const trimmed = description.trim();
  if (!trimmed) return "";

  const separatorIndex = trimmed.search(/\n\s*---\s*\n/);
  if (separatorIndex < 0) return trimmed;

  return trimmed.slice(0, separatorIndex).trim();
}

const META_DESCRIPTION_PAD = ` Pro více informací kontaktujte prodejce na ${SITE_DISPLAY_NAME}.`;

/**
 * Doplní krátkou meta description na cíl 150–160 znaků (bez vymýšlení produktových faktů).
 */
export function ensureMetaDescriptionLength(
  text: string,
  maxLength: number = LISTING_META_DESCRIPTION_MAX_LENGTH,
  minLength: number = LISTING_META_DESCRIPTION_MIN_LENGTH,
): string {
  const result = text.trim().slice(0, maxLength);
  if (result.length >= minLength || result.length === 0) {
    return result;
  }

  if (result.includes(SITE_DISPLAY_NAME)) {
    return result;
  }

  const base = result.replace(/[.!?]\s*$/, "");
  const padded = `${base}.${META_DESCRIPTION_PAD}`;
  if (padded.length <= maxLength) {
    return padded;
  }

  // Pad se nevejde celý — doplň co se vejde.
  const room = maxLength - base.length - 1;
  if (room < 20) return result;
  return `${base}.${META_DESCRIPTION_PAD.slice(0, room)}`.trimEnd();
}

/**
 * Meta description pro SERP: uložená AI hodnota, jinak úvod popisu (max 160).
 */
export function resolveListingMetaDescription(input: {
  metaDescription?: string | null;
  description?: string | null;
  title: string;
  locality: string;
}): string {
  const stored = input.metaDescription?.trim();
  if (stored) {
    return ensureMetaDescriptionLength(
      stored.slice(0, LISTING_META_DESCRIPTION_MAX_LENGTH),
    );
  }

  const intro = extractListingDescriptionIntro(input.description ?? "");
  if (intro) {
    return ensureMetaDescriptionLength(
      intro.slice(0, LISTING_META_DESCRIPTION_MAX_LENGTH),
    );
  }

  const fallback = `${input.title} — ${input.locality}`.trim();
  return ensureMetaDescriptionLength(
    fallback.slice(0, LISTING_META_DESCRIPTION_MAX_LENGTH),
  );
}
