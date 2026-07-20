import {
  LISTING_META_DESCRIPTION_MAX_LENGTH,
} from "@/config/listing-seo";
import { clampListingMetaDescription } from "@/lib/seo/clamp-listing-seo-text";

/** Úvod popisu před oddělovačem Parametrů (`---`). */
export function extractListingDescriptionIntro(description: string): string {
  const trimmed = description.trim();
  if (!trimmed) return "";

  const separatorIndex = trimmed.search(/\n\s*---\s*\n/);
  if (separatorIndex < 0) return trimmed;

  return trimmed.slice(0, separatorIndex).trim();
}

/**
 * Meta description pro SERP — clamp (včetně drop CTA). Bez doplňování CTA padu (SEO bible v1.6).
 * @deprecated Alias — preferuj přímo clampListingMetaDescription.
 */
export function ensureMetaDescriptionLength(
  text: string,
  maxLength: number = LISTING_META_DESCRIPTION_MAX_LENGTH,
): string {
  return clampListingMetaDescription(text, maxLength);
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
    return clampListingMetaDescription(stored);
  }

  const intro = extractListingDescriptionIntro(input.description ?? "");
  if (intro) {
    return clampListingMetaDescription(intro);
  }

  const fallback = `${input.title} — ${input.locality}`.trim();
  return clampListingMetaDescription(fallback);
}
