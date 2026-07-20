import { LISTING_META_DESCRIPTION_MAX_LENGTH } from "@/config/listing-seo";

/** Úvod popisu před oddělovačem Parametrů (`---`). */
export function extractListingDescriptionIntro(description: string): string {
  const trimmed = description.trim();
  if (!trimmed) return "";

  const separatorIndex = trimmed.search(/\n\s*---\s*\n/);
  if (separatorIndex < 0) return trimmed;

  return trimmed.slice(0, separatorIndex).trim();
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
    return stored.slice(0, LISTING_META_DESCRIPTION_MAX_LENGTH);
  }

  const intro = extractListingDescriptionIntro(input.description ?? "");
  if (intro) {
    return intro.slice(0, LISTING_META_DESCRIPTION_MAX_LENGTH);
  }

  const fallback = `${input.title} — ${input.locality}`.trim();
  return fallback.slice(0, LISTING_META_DESCRIPTION_MAX_LENGTH);
}
