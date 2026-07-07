/** Souřadnice z PostGIS sloupce `location` (GeoJSON, WKT, EWKB hex, EWKT). */

function parseEwkbHex(
  hex: string,
): { latitude: number; longitude: number } | null {
  const cleaned = hex.replace(/\s/g, "");
  if (!/^[0-9a-fA-F]+$/.test(cleaned) || cleaned.length < 42) {
    return null;
  }

  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Number.parseInt(cleaned.slice(i * 2, i * 2 + 2), 16);
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const littleEndian = bytes[0] === 1;

  let offset = 1;
  const wkbType = view.getUint32(offset, littleEndian);
  offset += 4;

  const geomType = wkbType & 0xff;
  if (geomType !== 1) return null;

  if ((wkbType & 0x20000000) !== 0) {
    offset += 4;
  }

  if (offset + 16 > bytes.length) return null;

  const longitude = view.getFloat64(offset, littleEndian);
  offset += 8;
  const latitude = view.getFloat64(offset, littleEndian);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return { latitude, longitude };
}

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

    const ewkt = /^SRID=\d+;\s*POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i.exec(
      trimmed,
    );
    if (ewkt) {
      const longitude = Number(ewkt[1]);
      const latitude = Number(ewkt[2]);
      if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
        return { latitude, longitude };
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

    const ewkb = parseEwkbHex(trimmed);
    if (ewkb) return ewkb;
  }

  return null;
}
