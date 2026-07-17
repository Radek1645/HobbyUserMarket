/**
 * SPA page views pro GA4 přes GTM (P35).
 * První načtení stránky měří Configuration tag; client navigace = virtual_pageview.
 */

export const GTM_VIRTUAL_PAGEVIEW_EVENT = "virtual_pageview";

export type VirtualPageviewPayload = {
  pagePath?: string;
  pageTitle?: string;
};

/** Push do dataLayer — GTM Custom Event → GA4 page_view. */
export function pushVirtualPageview(payload: VirtualPageviewPayload = {}): void {
  if (typeof window === "undefined") {
    return;
  }

  const pagePath =
    payload.pagePath ??
    `${window.location.pathname}${window.location.search}`;
  const pageTitle = payload.pageTitle ?? document.title;

  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({
    event: GTM_VIRTUAL_PAGEVIEW_EVENT,
    page_path: pagePath,
    page_title: pageTitle,
  });
}
