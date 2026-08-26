/** Query parametry z FB / Ads, které máme táhnout přes CTA až na `/inzerat/novy`. */
export const CAMPAIGN_QUERY_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "fbclid",
  "gclid",
] as const;

export type CampaignQuerySource =
  | Pick<URLSearchParams, "get">
  | Record<string, string | string[] | undefined>;

function readQueryValue(
  source: CampaignQuerySource,
  key: string,
): string | undefined {
  if (typeof (source as URLSearchParams).get === "function") {
    return (source as URLSearchParams).get(key) ?? undefined;
  }

  const raw = (source as Record<string, string | string[] | undefined>)[key];
  return Array.isArray(raw) ? raw[0] : raw;
}

/** Vybere UTM / click-id z URL. */
export function pickCampaignSearchParams(
  source: CampaignQuerySource,
): URLSearchParams {
  const next = new URLSearchParams();
  for (const key of CAMPAIGN_QUERY_KEYS) {
    const value = readQueryValue(source, key)?.trim();
    if (value) {
      next.set(key, value);
    }
  }
  return next;
}

/** Připojí campaign query k interní cestě (zachová existující `?` i `#`). */
export function withCampaignQuery(
  path: string,
  campaign: URLSearchParams,
): string {
  const qs = campaign.toString();
  if (!qs) {
    return path;
  }

  const hashIndex = path.indexOf("#");
  const withoutHash = hashIndex >= 0 ? path.slice(0, hashIndex) : path;
  const hash = hashIndex >= 0 ? path.slice(hashIndex) : "";
  const separator = withoutHash.includes("?") ? "&" : "?";
  return `${withoutHash}${separator}${qs}${hash}`;
}

export function createListingHrefWithCampaign(
  campaign: URLSearchParams,
  listingPath = "/inzerat/novy",
): string {
  return withCampaignQuery(listingPath, campaign);
}

/** Login wall, když guest draft ještě není zapnutý — `next` drží UTM. */
export function loginRedirectForCreateListing(
  campaign: URLSearchParams,
): string {
  const next = createListingHrefWithCampaign(campaign);
  return `/login?next=${encodeURIComponent(next)}&message=create_listing&tab=register`;
}
