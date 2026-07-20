import {
  LISTING_IMAGE_ALT_MAX_LENGTH,
  LISTING_META_DESCRIPTION_MAX_LENGTH,
} from "@/config/listing-seo";

/** Věty CTA v meta — při clampu jdou pryč dřív než produkt / lokalita. */
const META_DESCRIPTION_CTA_HINTS = [
  /pro více informací/i,
  /podívejte se na detaily/i,
  /kontaktujte prodejce/i,
  /napište prodejci/i,
  /detaily a kontakt na platformě/i,
];

/**
 * Ořízne text na maxLength — preferuje konec věty, pak mezeru, jinak tvrdý řez.
 * SEO pole: AI má soft cíl, storage/SERP mají pevný strop (bez hard reject ve formuláři).
 */
export function softClampText(
  text: string,
  maxLength: number,
): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  if (trimmed.length <= maxLength) return trimmed;

  const slice = trimmed.slice(0, maxLength);
  const sentenceEnd = Math.max(
    slice.lastIndexOf(". "),
    slice.lastIndexOf("! "),
    slice.lastIndexOf("? "),
    slice.lastIndexOf("."),
    slice.lastIndexOf("!"),
    slice.lastIndexOf("?"),
  );

  if (sentenceEnd >= Math.floor(maxLength * 0.6)) {
    return slice.slice(0, sentenceEnd + 1).trimEnd();
  }

  const space = slice.lastIndexOf(" ");
  if (space >= Math.floor(maxLength * 0.6)) {
    return slice.slice(0, space).trimEnd();
  }

  return slice.trimEnd();
}

function splitIntoSentences(text: string): string[] {
  const matches = text.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g);
  if (!matches) return [text];
  return matches.map((part) => part.trim()).filter(Boolean);
}

function isMetaCtaSentence(sentence: string): boolean {
  return META_DESCRIPTION_CTA_HINTS.some((hint) => hint.test(sentence));
}

/** Odstraní koncové CTA věty (SEO bible §3.3 — priorita produktu a lokality). */
export function dropTrailingMetaCtaSentences(text: string): string {
  const sentences = splitIntoSentences(text.trim());
  if (sentences.length <= 1) return text.trim();

  while (sentences.length > 1 && isMetaCtaSentence(sentences[sentences.length - 1]!)) {
    sentences.pop();
  }

  return sentences.join(" ").replace(/\s+/g, " ").trim();
}

/**
 * Clamp meta description: nejdřív drop CTA, pak větný soft clamp.
 */
export function clampListingMetaDescription(
  text: string,
  maxLength: number = LISTING_META_DESCRIPTION_MAX_LENGTH,
): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  if (trimmed.length <= maxLength) return trimmed;

  const withoutCta = dropTrailingMetaCtaSentences(trimmed);
  if (withoutCta.length <= maxLength) return withoutCta;

  return softClampText(withoutCta, maxLength);
}

export function clampListingImageAlt(
  text: string,
  maxLength: number = LISTING_IMAGE_ALT_MAX_LENGTH,
): string {
  return softClampText(text, maxLength);
}
