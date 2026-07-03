import { getMapyApiKey } from "@/lib/mapy/env";
import {
  formatHeaderLocation,
  formatPublicListingLocation,
} from "@/lib/posts/format-public-location";
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

/** Alias pro filtr polohy návštěvníka na homepage. */
export function formatPublicAreaLocation(locationText: string): string {
  return formatPublicListingLocation(locationText);
}

/** Kompaktní štítek polohy do headeru. */
export function formatHeaderAreaLocation(locationText: string): string {
  return formatHeaderLocation(locationText);
}

/** Obec/město z Mapy `location` řetězce (první segment, bez „- město“). */
function municipalityFromMapyLocation(location?: string): string | null {
  if (!location) return null;
  const withoutCountry = location.replace(/,?\s*Česko\s*$/i, "").trim();
  const [first] = withoutCountry.split(",").map((part) => part.trim());
  if (!first) return null;
  return first.replace(/\s*-\s*město$/i, "").trim() || null;
}

/** Kontextová nápověda v našeptávači (např. kraj u obce). */
export function formatMapyLocationLabel(entity: MapyGeocodeEntity): string {
  const name = entity.name.trim();
  const municipality = municipalityFromMapyLocation(entity.location);

  if (
    entity.type === "regional.municipality" ||
    entity.type === "regional.municipality_part"
  ) {
    if (municipality && municipality !== name) {
      return `${name}, ${municipality}`;
    }
    return name || municipality || "";
  }

  if (
    (entity.type === "regional.address" || entity.type === "regional.street") &&
    municipality &&
    name !== municipality
  ) {
    return `${name}, ${municipality}`;
  }

  return name || municipality || "";
}

/** Krátký název pro uložení do `location_text` (ulice/obec + město, ne kraj). */
export function locationTextFromEntity(entity: MapyGeocodeEntity): string {
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
  options?: { approximate?: boolean },
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

  const preferred = options?.approximate
    ? (items.find((item) => item.type === "regional.street") ??
      items.find((item) => item.type === "regional.municipality_part") ??
      items.find((item) => item.type === "regional.municipality") ??
      items.find((item) => item.type === "regional.address") ??
      items[0])
    : (items.find((item) => item.type === "regional.address") ??
      items.find((item) => item.type === "regional.street") ??
      items.find((item) => item.type === "regional.municipality_part") ??
      items.find((item) => item.type === "regional.municipality") ??
      items[0]);

  const selection = entityToLocationSelection(preferred);

  if (options?.approximate) {
    return {
      ...selection,
      locationText: formatPublicAreaLocation(selection.locationText),
    };
  }

  return selection;
}
