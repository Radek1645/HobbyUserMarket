/** Auto-synced from src/config/moderation/listing-cta.ts — do not edit. */
/** CTA na konci úvodu cleanedDescription — podle typu inzerátu (ne vždy „prodejci“). */
const LISTING_PLATFORM_CTA_BY_CATEGORY: Record<string, string> = {
  zbozi: "Pro více informací napište prodejci zprávu přes web.",
  sluzby: "Pro více informací napište poskytovateli zprávu přes web.",
  udalost: "Pro více informací napište pořadateli zprávu přes web.",
  nemovitost: "Pro více informací napište inzerentovi zprávu přes web.",
  prace: "Pro více informací napište zadavateli zprávu přes web.",
};

const DEFAULT_CTA = LISTING_PLATFORM_CTA_BY_CATEGORY.zbozi!;

/** Match i starší CTA „přes platformu“ — při normalize se přepíše. */
function platformCtaPattern(): RegExp {
  return /Pro více informací napište \S+ zprávu přes (?:platformu|web)\.?/gi;
}

export function getListingPlatformCta(categoryType?: string | null): string {
  if (
    categoryType &&
    Object.prototype.hasOwnProperty.call(
      LISTING_PLATFORM_CTA_BY_CATEGORY,
      categoryType,
    )
  ) {
    return LISTING_PLATFORM_CTA_BY_CATEGORY[categoryType]!;
  }
  return DEFAULT_CTA;
}

/** Nahradí špatnou CTA větu (např. „prodejci“ u práce) správnou podle kategorie. */
export function applyListingPlatformCta(
  description: string,
  categoryType?: string | null,
): string {
  const cta = getListingPlatformCta(categoryType);
  const trimmed = description.trim();
  if (!trimmed) return trimmed;

  const pattern = platformCtaPattern();
  if (!pattern.test(trimmed)) return trimmed;

  return trimmed
    .replace(platformCtaPattern(), cta)
    .replace(/\s{2,}/g, " ")
    .trim();
}
