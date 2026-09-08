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

export type CampaignQueryKey = (typeof CAMPAIGN_QUERY_KEYS)[number];

export type CampaignAttribution = Partial<Record<CampaignQueryKey, string>>;

export const CAMPAIGN_ATTRIBUTION_FORM_FIELD = "campaignAttribution";

const CAMPAIGN_ATTRIBUTION_MAX_VALUE_LENGTH = 200;
const CAMPAIGN_ATTRIBUTION_MAX_JSON_LENGTH = 2048;

const CAMPAIGN_QUERY_KEY_SET = new Set<string>(CAMPAIGN_QUERY_KEYS);

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

function sanitizeAttributionValue(value: string): string | null {
  const trimmed = value.trim().slice(0, CAMPAIGN_ATTRIBUTION_MAX_VALUE_LENGTH);
  if (!trimmed) {
    return null;
  }
  if (/[\x00-\x1f\x7f]/.test(trimmed)) {
    return null;
  }
  return trimmed;
}

/** Allowlist UTM / click-id z query (délka + bez řídicích znaků). */
export function campaignParamsToAttribution(
  params: URLSearchParams,
): CampaignAttribution {
  const record: CampaignAttribution = {};
  for (const key of CAMPAIGN_QUERY_KEYS) {
    const raw = params.get(key);
    if (!raw) {
      continue;
    }
    const value = sanitizeAttributionValue(raw);
    if (value) {
      record[key] = value;
    }
  }
  return record;
}

export function serializeCampaignAttributionForForm(
  params: URLSearchParams,
): string {
  const attribution = campaignParamsToAttribution(params);
  if (Object.keys(attribution).length === 0) {
    return "";
  }
  return JSON.stringify(attribution);
}

/** Sanitizace JSON z formuláře — jen známé klíče. Prázdné / padělek → null. */
export function parseCampaignAttributionFromFormValue(
  raw: unknown,
): CampaignAttribution | null {
  if (typeof raw !== "string") {
    return null;
  }
  const trimmed = raw.trim();
  if (
    trimmed === "" ||
    trimmed.length > CAMPAIGN_ATTRIBUTION_MAX_JSON_LENGTH
  ) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed) as unknown;
  } catch {
    return null;
  }

  if (
    parsed === null ||
    typeof parsed !== "object" ||
    Array.isArray(parsed)
  ) {
    return null;
  }

  const record: CampaignAttribution = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (!CAMPAIGN_QUERY_KEY_SET.has(key) || typeof value !== "string") {
      continue;
    }
    const sanitized = sanitizeAttributionValue(value);
    if (sanitized) {
      record[key as CampaignQueryKey] = sanitized;
    }
  }

  return Object.keys(record).length > 0 ? record : null;
}

const CAMPAIGN_ATTRIBUTION_KEY_LABELS: Record<CampaignQueryKey, string> = {
  utm_source: "Zdroj",
  utm_medium: "Médium",
  utm_campaign: "Kampaň",
  utm_content: "Varianta",
  utm_term: "Termín",
  fbclid: "Facebook klik",
  gclid: "Google klik",
};

/** Krátký štítek do tabulky God Mode. */
export function formatCampaignAttributionSource(
  attribution: CampaignAttribution | null | undefined,
): string {
  if (!attribution) {
    return "—";
  }
  if (attribution.utm_source) {
    return attribution.utm_source;
  }
  if (attribution.fbclid) {
    return "facebook";
  }
  if (attribution.gclid) {
    return "google";
  }
  return "—";
}

export function campaignAttributionEntries(
  attribution: CampaignAttribution | null | undefined,
): Array<{ key: CampaignQueryKey; label: string; value: string }> {
  if (!attribution) {
    return [];
  }
  const entries: Array<{
    key: CampaignQueryKey;
    label: string;
    value: string;
  }> = [];
  for (const key of CAMPAIGN_QUERY_KEYS) {
    const value = attribution[key];
    if (value) {
      entries.push({
        key,
        label: CAMPAIGN_ATTRIBUTION_KEY_LABELS[key],
        value,
      });
    }
  }
  return entries;
}
