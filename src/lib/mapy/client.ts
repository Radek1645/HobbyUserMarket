import { getMapyApiKey } from "@/lib/mapy/env";
import type {
  MapyGeocodeEntity,
  MapyGeocodeResponse,
  MapyLocationSelection,
  MapyRgeocodeResponse,
} from "@/lib/mapy/types";

const MAPY_API_BASE = "https://api.mapy.cz";

export class MapyApiError extends Error {
  constructor(
    readonly code: "missing_key" | "network" | "http" | "empty",
    message: string,
  ) {
    super(message);
    this.name = "MapyApiError";
  }
}

function buildUrl(path: string, params: Record<string, string | string[]>): URL {
  const url = new URL(`${MAPY_API_BASE}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        url.searchParams.append(key, item);
      }
    } else {
      url.searchParams.set(key, value);
    }
  }
  return url;
}

async function mapyGet<T>(
  path: string,
  params: Record<string, string | string[]>,
  signal?: AbortSignal,
): Promise<T> {
  const apiKey = getMapyApiKey();
  if (!apiKey) {
    throw new MapyApiError(
      "missing_key",
      "Mapy.cz API klíč není nastaven (NEXT_PUBLIC_MAPY_CZ_API_KEY).",
    );
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path, params).toString(), {
      headers: { "X-Mapy-Api-Key": apiKey },
      signal,
    });
  } catch {
    throw new MapyApiError(
      "network",
      "Mapy.cz API není dostupné. Zkus to znovu za chvíli.",
    );
  }

  if (!response.ok) {
    throw new MapyApiError(
      "http",
      `Mapy.cz API vrátilo chybu (${response.status}).`,
    );
  }

  return response.json() as Promise<T>;
}

/** Kontextová nápověda v našeptávači (např. kraj u obce). */
export function formatMapyLocationLabel(entity: MapyGeocodeEntity): string {
  const name = entity.name.trim();
  const area = entity.location
    ?.trim()
    .replace(/,?\s*Česko\s*$/i, "")
    .trim();

  if (
    entity.type === "regional.municipality" ||
    entity.type === "regional.municipality_part"
  ) {
    return area && area !== name ? area : name;
  }

  if (
    (entity.type === "regional.address" || entity.type === "regional.street") &&
    area &&
    name !== area
  ) {
    return `${name}, ${area}`;
  }

  return name || area || "";
}

/** Krátký název pro uložení do `location_text` (obec, ne kraj). */
export function locationTextFromEntity(entity: MapyGeocodeEntity): string {
  const name = entity.name.trim();

  if (
    entity.type === "regional.municipality" ||
    entity.type === "regional.municipality_part"
  ) {
    return name;
  }

  return formatMapyLocationLabel(entity);
}

export function entityToLocationSelection(
  entity: MapyGeocodeEntity,
): MapyLocationSelection {
  return {
    locationText: locationTextFromEntity(entity),
    latitude: entity.position.lat,
    longitude: entity.position.lon,
  };
}

const SUGGEST_TYPES = [
  "regional.municipality",
  "regional.municipality_part",
  "regional.street",
  "regional.address",
] as const;

export async function suggestPlaces(
  query: string,
  signal?: AbortSignal,
): Promise<MapyGeocodeEntity[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  const data = await mapyGet<MapyGeocodeResponse>(
    "/v1/suggest",
    {
      query: trimmed,
      lang: "cs",
      limit: "10",
      locality: "cz",
      type: [...SUGGEST_TYPES],
    },
    signal,
  );

  return data.items ?? [];
}

/** @deprecated Použij suggestPlaces */
export const suggestLocalities = suggestPlaces;

export async function reverseGeocodeLocation(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<MapyLocationSelection> {
  const data = await mapyGet<MapyRgeocodeResponse>(
    "/v1/rgeocode",
    {
      lat: String(latitude),
      lon: String(longitude),
      lang: "cs",
    },
    signal,
  );

  const items = data.items ?? [];
  if (items.length === 0) {
    throw new MapyApiError(
      "empty",
      "Pro tuto polohu se nepodařilo určit název obce.",
    );
  }

  const preferred =
    items.find((item) => item.type === "regional.address") ??
    items.find((item) => item.type === "regional.street") ??
    items.find((item) => item.type === "regional.municipality_part") ??
    items.find((item) => item.type === "regional.municipality") ??
    items[0];

  return entityToLocationSelection(preferred);
}
