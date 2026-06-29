/** Souřadnice z PostGIS sloupce `location` (GeoJSON nebo WKT). */
export function parsePostLocation(
  location: unknown,
): { latitude: number; longitude: number } | null {
  if (!location) return null;

  if (typeof location === "object" && location !== null) {
    const geo = location as { type?: string; coordinates?: number[] };
    if (
      geo.type === "Point" &&
      Array.isArray(geo.coordinates) &&
      geo.coordinates.length >= 2
    ) {
      const [longitude, latitude] = geo.coordinates;
      if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
        return { latitude, longitude };
      }
    }
  }

  if (typeof location === "string") {
    const trimmed = location.trim();
    if (trimmed.startsWith("{")) {
      try {
        return parsePostLocation(JSON.parse(trimmed) as unknown);
      } catch {
        return null;
      }
    }

    const wkt = /POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i.exec(trimmed);
    if (wkt) {
      const longitude = Number(wkt[1]);
      const latitude = Number(wkt[2]);
      if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
        return { latitude, longitude };
      }
    }
  }

  return null;
}
