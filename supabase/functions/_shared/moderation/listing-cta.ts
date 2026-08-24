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

/**
 * Platformní CTA včetně staršího „přes platformu“ a off-platform variant
 * (Facebook / Instagram), které AI občas doplní u událostí.
 */
export function listingPlatformCtaPattern(flags = "gi"): RegExp {
  return new RegExp(
    String.raw`Pro více informací napište \S+ zprávu přes (?:platformu|web|Facebook|Instagram)\.?`,
    flags,
  );
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

/**
 * Kanál z `external_url` pro AI prompt — plné URL do Gemini neposíláme
 * (zkopírovala by ho do popisu).
 */
export function getListingExternalUrlChannelLabel(
  url?: string | null,
): "Facebook" | "Instagram" | "web" | null {
  const trimmed = url?.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:") return null;
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    if (
      host === "facebook.com" ||
      host.endsWith(".facebook.com") ||
      host === "fb.com" ||
      host.endsWith(".fb.com") ||
      host === "fb.me"
    ) {
      return "Facebook";
    }
    if (host === "instagram.com" || host.endsWith(".instagram.com")) {
      return "Instagram";
    }
    return "web";
  } catch {
    return null;
  }
}

export type ApplyListingPlatformCtaOptions = {
  /**
   * Událost s vyplněným `external_url` — CTA „přes web“ je duplicitní
   * k tlačítku Facebook / Instagram / Další informace online.
   */
  omitCta?: boolean;
};

function collapseCtaSpacing(text: string): string {
  return text.replace(/ {2,}/g, " ").replace(/ \n/g, "\n").trim();
}

/** Nahradí špatnou CTA větu (např. „prodejci“ u práce) správnou podle kategorie. */
export function applyListingPlatformCta(
  description: string,
  categoryType?: string | null,
  options?: ApplyListingPlatformCtaOptions,
): string {
  const trimmed = description.trim();
  if (!trimmed) return trimmed;

  const hasCta = listingPlatformCtaPattern().test(trimmed);
  if (!hasCta) return trimmed;

  if (options?.omitCta) {
    return collapseCtaSpacing(
      trimmed.replace(listingPlatformCtaPattern(), ""),
    );
  }

  const cta = getListingPlatformCta(categoryType);
  return collapseCtaSpacing(
    trimmed.replace(listingPlatformCtaPattern(), cta),
  );
}
