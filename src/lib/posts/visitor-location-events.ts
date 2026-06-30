export const VISITOR_LOCATION_CHANGED = "hum:visitor-location-changed";
export const VISITOR_LOCATION_PANEL_OPEN = "hum:visitor-location-panel-open";

export function notifyVisitorLocationChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(VISITOR_LOCATION_CHANGED));
}

export function requestVisitorLocationPanelOpen(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(VISITOR_LOCATION_PANEL_OPEN));
}
