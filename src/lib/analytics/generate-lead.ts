import {
  GENERATE_LEAD_SENT_KEY,
  GTM_GENERATE_LEAD_EVENT,
} from "@/config/gtm";

function generateLeadSentKey(postId: string): string {
  return `${GENERATE_LEAD_SENT_KEY}:${postId}`;
}

export function hasGenerateLeadBeenSent(postId: string): boolean {
  try {
    return localStorage.getItem(generateLeadSentKey(postId)) === "1";
  } catch {
    return false;
  }
}

function markGenerateLeadSent(postId: string): void {
  try {
    localStorage.setItem(generateLeadSentKey(postId), "1");
  } catch {
    /* localStorage nedostupný — event může odejít i bez dedupe */
  }
}

/** Push do dataLayer — GTM Custom Event → GA4 `generate_lead`. */
export function pushGenerateLead(params: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({
    event: GTM_GENERATE_LEAD_EVENT,
    ...params,
  });
}

/** GA4 konverze publikace — max jednou na `postId`. */
export function pushGenerateLeadOnce(
  postId: string,
  params: Record<string, unknown> = {},
): void {
  if (hasGenerateLeadBeenSent(postId)) {
    return;
  }

  markGenerateLeadSent(postId);
  pushGenerateLead(params);
}
