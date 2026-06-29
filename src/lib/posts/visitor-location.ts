export type VisitorLocation = {
  locationText: string;
  latitude: number;
  longitude: number;
};

const STORAGE_KEY = "hum_visitor_location";

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
