import {
  MAPY_SUGGEST_CACHE_MAX_ENTRIES,
  MAPY_SUGGEST_CACHE_TTL_MS,
  MAPY_SUGGEST_MIN_QUERY_LENGTH,
} from "@/config/mapy";
import { getMapyApiKey } from "@/lib/mapy/env";
import { isAbortError, MapyApiError } from "@/lib/mapy/errors";
import {
  entityToLocationSelection,
  formatPublicAreaLocation,
} from "@/lib/mapy/format";
import type {
  MapyGeocodeEntity,
  MapyGeocodeResponse,
  MapyLocationSelection,
  MapyRgeocodeResponse,
} from "@/lib/mapy/types";
import { getSiteUrl } from "@/lib/supabase/env";

const MAPY_API_BASE = "https://api.mapy.cz";

const SUGGEST_TYPES = [
  "regional.municipality",
  "regional.municipality_part",
  "regional.street",
  "regional.address",
] as const;

type SuggestCacheEntry = {
  items: MapyGeocodeEntity[];
  expiresAt: number;
};

const suggestCache = new Map<string, SuggestCacheEntry>();

function cacheKeyForQuery(query: string): string {
  return query.trim().toLowerCase();
}

function readSuggestCache(query: string): MapyGeocodeEntity[] | null {
  const key = cacheKeyForQuery(query);
  const entry = suggestCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    suggestCache.delete(key);
    return null;
  }
  suggestCache.delete(key);
  suggestCache.set(key, entry);
  return entry.items;
}

function writeSuggestCache(query: string, items: MapyGeocodeEntity[]): void {
  const key = cacheKeyForQuery(query);
  if (suggestCache.has(key)) {
    suggestCache.delete(key);
  }
  suggestCache.set(key, {
    items,
    expiresAt: Date.now() + MAPY_SUGGEST_CACHE_TTL_MS,
  });
  while (suggestCache.size > MAPY_SUGGEST_CACHE_MAX_ENTRIES) {
    const oldest = suggestCache.keys().next().value;
    if (oldest === undefined) break;
    suggestCache.delete(oldest);
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

export type MapyUpstreamOptions = {
  signal?: AbortSignal;
  /** Origin/Referer z prohlížeče — Mapy.cz HTTP-referrer lock ho na serverovém fetch jinak nevidí. */
  referer?: string;
};

/** Referer, který Mapy.cz očekává při locku na localhost / zapikolou.cz. */
export function refererForMapyRequest(request: Request): string {
  const origin = request.headers.get("origin")?.trim();
  if (origin) return origin;
  const referer = request.headers.get("referer")?.trim();
  if (referer) return referer;
  return getSiteUrl();
}

async function mapyGet<T>(
  path: string,
  params: Record<string, string | string[]>,
  options?: MapyUpstreamOptions,
): Promise<T> {
  const apiKey = getMapyApiKey();
  if (!apiKey) {
    throw new MapyApiError(
      "missing_key",
      "Mapy.cz API klíč není nastaven (MAPY_CZ_API_KEY).",
    );
  }

  const headers: Record<string, string> = {
    "X-Mapy-Api-Key": apiKey,
  };
  if (options?.referer) {
    headers.Referer = options.referer;
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path, params).toString(), {
      headers,
      signal: options?.signal,
    });
  } catch (err) {
    if (options?.signal?.aborted || isAbortError(err)) {
      throw err;
    }
    throw new MapyApiError(
      "network",
      "Mapy.cz API není dostupné. Zkuste to prosím znovu za chvíli.",
    );
  }

  if (!response.ok) {
    console.error("mapy http:", path, response.status);
    throw new MapyApiError(
      "http",
      `Mapy.cz API vrátilo chybu (${response.status}).`,
    );
  }

  return response.json() as Promise<T>;
}

export async function suggestPlaces(
  query: string,
  options?: MapyUpstreamOptions,
): Promise<MapyGeocodeEntity[]> {
  const trimmed = query.trim();
  if (trimmed.length < MAPY_SUGGEST_MIN_QUERY_LENGTH) {
    return [];
  }

  const cached = readSuggestCache(trimmed);
  if (cached) {
    return cached;
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
    options,
  );

  const items = data.items ?? [];
  writeSuggestCache(trimmed, items);
  return items;
}

export async function reverseGeocodeLocation(
  latitude: number,
  longitude: number,
  options?: MapyUpstreamOptions & { approximate?: boolean },
): Promise<MapyLocationSelection> {
  const data = await mapyGet<MapyRgeocodeResponse>(
    "/v1/rgeocode",
    {
      lat: String(latitude),
      lon: String(longitude),
      lang: "cs",
    },
    options,
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
