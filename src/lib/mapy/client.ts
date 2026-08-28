import {
  MAPY_SUGGEST_MIN_QUERY_LENGTH,
} from "@/config/mapy";
import { isAbortError, MapyApiError } from "@/lib/mapy/errors";
import type { MapyGeocodeEntity, MapyLocationSelection } from "@/lib/mapy/types";

export { MapyApiError } from "@/lib/mapy/errors";
export {
  entityToLocationSelection,
  formatHeaderAreaLocation,
  formatMapyLocationLabel,
  formatPublicAreaLocation,
  locationTextFromEntity,
} from "@/lib/mapy/format";

async function readMapyError(
  response: Response,
  fallbackCode: MapyApiError["code"],
  fallbackMessage: string,
): Promise<MapyApiError> {
  let message = fallbackMessage;
  try {
    const body = (await response.json()) as { error?: unknown };
    if (typeof body.error === "string" && body.error.trim()) {
      message = body.error;
    }
  } catch {
    // tělo nemusí být JSON
  }

  if (response.status === 429) {
    return new MapyApiError("rate_limit", message);
  }
  if (response.status === 503) {
    return new MapyApiError("missing_key", message);
  }
  return new MapyApiError(fallbackCode, message);
}

async function mapyProxyFetch(
  path: string,
  body: unknown,
  signal?: AbortSignal,
): Promise<Response> {
  try {
    return await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if (signal?.aborted || isAbortError(err)) {
      throw err;
    }
    throw new MapyApiError(
      "network",
      "Mapy.cz API není dostupné. Zkuste to prosím znovu za chvíli.",
    );
  }
}

export async function suggestPlaces(
  query: string,
  signal?: AbortSignal,
): Promise<MapyGeocodeEntity[]> {
  const trimmed = query.trim();
  if (trimmed.length < MAPY_SUGGEST_MIN_QUERY_LENGTH) {
    return [];
  }

  const response = await mapyProxyFetch(
    "/api/mapy/suggest",
    { query: trimmed },
    signal,
  );

  if (!response.ok) {
    throw await readMapyError(
      response,
      "http",
      "Našeptávač lokality teď nefunguje.",
    );
  }

  const data = (await response.json()) as { items?: MapyGeocodeEntity[] };
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
  const response = await mapyProxyFetch(
    "/api/mapy/rgeocode",
    {
      latitude,
      longitude,
      approximate: options?.approximate === true,
    },
    signal,
  );

  if (!response.ok) {
    throw await readMapyError(
      response,
      response.status === 404 ? "empty" : "http",
      "Polohu se nepodařilo převést na název obce.",
    );
  }

  return (await response.json()) as MapyLocationSelection;
}
