export type VisitorLocation = {
  locationText: string;
  latitude: number;
  longitude: number;
};

const STORAGE_KEY = "hum_visitor_location";
const SEARCH_BY_LOCATION_KEY = "hum_search_by_location";
const LOCATION_PROMPT_DISMISSED_KEY = "hum_location_prompt_dismissed";

export function loadSearchByLocation(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(SEARCH_BY_LOCATION_KEY) !== "false";
}

export function saveSearchByLocation(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SEARCH_BY_LOCATION_KEY, String(enabled));
}

export function loadLocationPromptDismissed(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(LOCATION_PROMPT_DISMISSED_KEY) === "true";
}

export function saveLocationPromptDismissed(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCATION_PROMPT_DISMISSED_KEY, "true");
}

export function clearLocationPromptDismissed(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LOCATION_PROMPT_DISMISSED_KEY);
}

export function loadVisitorLocation(): VisitorLocation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as VisitorLocation;
    if (
      typeof parsed.locationText === "string" &&
      typeof parsed.latitude === "number" &&
      typeof parsed.longitude === "number" &&
      !Number.isNaN(parsed.latitude) &&
      !Number.isNaN(parsed.longitude)
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveVisitorLocation(location: VisitorLocation): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
}

export function clearVisitorLocation(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
