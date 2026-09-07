import { GTM_AI_PREFILL_SUBMIT_EVENT } from "@/config/gtm";

/** Push do dataLayer — GTM Custom Event → GA4 `ai_prefill_submit`. Bez dedupe (retry je další pokus). */
export function pushAiPrefillSubmit(photoCount: number): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({
    event: GTM_AI_PREFILL_SUBMIT_EVENT,
    photo_count: photoCount,
  });
}
