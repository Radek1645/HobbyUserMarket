import {
  CAMPAIGN_ATTRIBUTION_MAX_AGE_MS,
  CAMPAIGN_ATTRIBUTION_STORAGE_KEY,
} from "@/config/meta-pixel";
import {
  CAMPAIGN_QUERY_KEYS,
  pickCampaignSearchParams,
  type CampaignQuerySource,
} from "@/lib/promo/campaign-query";

type StoredCampaignAttribution = {
  capturedAt: number;
  params: Record<string, string>;
};

function paramsToRecord(params: URLSearchParams): Record<string, string> {
  const record: Record<string, string> = {};
  for (const key of CAMPAIGN_QUERY_KEYS) {
    const value = params.get(key)?.trim();
    if (value) {
      record[key] = value;
    }
  }
  return record;
}

function recordToParams(record: Record<string, string>): URLSearchParams {
  const params = new URLSearchParams();
  for (const key of CAMPAIGN_QUERY_KEYS) {
    const value = record[key]?.trim();
    if (value) {
      params.set(key, value);
    }
  }
  return params;
}

function readStoredAttribution(): StoredCampaignAttribution | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = localStorage.getItem(CAMPAIGN_ATTRIBUTION_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<StoredCampaignAttribution>;
    if (
      typeof parsed.capturedAt !== "number" ||
      !Number.isFinite(parsed.capturedAt) ||
      typeof parsed.params !== "object" ||
      parsed.params === null
    ) {
      return null;
    }

    if (Date.now() - parsed.capturedAt > CAMPAIGN_ATTRIBUTION_MAX_AGE_MS) {
      localStorage.removeItem(CAMPAIGN_ATTRIBUTION_STORAGE_KEY);
      return null;
    }

    return {
      capturedAt: parsed.capturedAt,
      params: parsed.params,
    };
  } catch {
    return null;
  }
}

function writeStoredAttribution(attribution: StoredCampaignAttribution): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(
      CAMPAIGN_ATTRIBUTION_STORAGE_KEY,
      JSON.stringify(attribution),
    );
  } catch {
    /* private mode / quota */
  }
}

/** Uložené UTM / click-id z prvního vstupu kampaně. */
export function readStoredCampaignParams(): URLSearchParams {
  const stored = readStoredAttribution();
  if (!stored) {
    return new URLSearchParams();
  }
  return recordToParams(stored.params);
}

/**
 * Při prvním vstupu s UTM uloží parametry; další hit s novými hodnotami přepíše
 * jen přítomné klíče. Prázdná URL uložené hodnoty nemaže.
 */
export function persistCampaignQuery(source: CampaignQuerySource): void {
  const incoming = pickCampaignSearchParams(source);
  const incomingRecord = paramsToRecord(incoming);
  if (Object.keys(incomingRecord).length === 0) {
    return;
  }

  const stored = readStoredAttribution();
  writeStoredAttribution({
    capturedAt: Date.now(),
    params: { ...(stored?.params ?? {}), ...incomingRecord },
  });
}

/** URL má přednost, jinak uložená atribuce z landing page. */
export function resolveCampaignSearchParams(
  source: CampaignQuerySource,
): URLSearchParams {
  const fromUrl = pickCampaignSearchParams(source);
  if ([...fromUrl.keys()].length > 0) {
    return fromUrl;
  }
  return readStoredCampaignParams();
}

/** Parametry pro `fbq` / dataLayer — jen neprázdné UTM klíče. */
export function campaignParamsToEventData(
  params: URLSearchParams = readStoredCampaignParams(),
): Record<string, string> {
  return paramsToRecord(params);
}
