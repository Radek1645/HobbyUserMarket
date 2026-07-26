import { LEGAL_INLINE_LINK_PHRASES } from "@/config/legal-inline-links";

export type LegalTextSegment = {
  text: string;
  href?: string;
};

/**
 * Rozdělí plain text na segmenty; zmínky právních dokumentů dostanou `href`.
 * Pro JSON-LD / e-maily nepoužívej — tam nech plain text.
 */
export function splitLegalMentions(text: string): LegalTextSegment[] {
  if (!text) return [];

  const phrases = [...LEGAL_INLINE_LINK_PHRASES].sort(
    (a, b) => b.phrase.length - a.phrase.length,
  );

  const escaped = phrases.map((item) =>
    item.phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  );
  const pattern = new RegExp(`(${escaped.join("|")})`, "g");
  const hrefByPhrase = new Map(
    phrases.map((item) => [item.phrase, item.href] as const),
  );

  return text.split(pattern).flatMap((part) => {
    if (!part) return [];
    const href = hrefByPhrase.get(part);
    return href ? [{ text: part, href }] : [{ text: part }];
  });
}
