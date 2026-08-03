/** Auto-synced from src/config/moderation/listing-cta.ts — do not edit. */
const GOODS_CTA = "Pro více informací napište prodejci zprávu přes web.";

/** CTA na konci úvodu cleanedDescription — podle typu inzerátu (ne vždy „prodejci“). */
const LISTING_PLATFORM_CTA_BY_CATEGORY: Record<string, string> = {
  auto: GOODS_CTA,
  detsky: GOODS_CTA,
  dum: GOODS_CTA,
  elektro: GOODS_CTA,
  moda: GOODS_CTA,
  sport: GOODS_CTA,
  hobby: GOODS_CTA,
  ostatni: GOODS_CTA,
  sluzby: "Pro více informací napište poskytovateli zprávu přes web.",
  udalost: "Pro více informací napište pořadateli zprávu přes web.",
  nemovitost: "Pro více informací napište inzerentovi zprávu přes web.",
  prace: "Pro více informací napište zadavateli zprávu přes web.",
};

const DEFAULT_CTA = GOODS_CTA;

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
