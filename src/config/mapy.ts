/** Mapy.cz REST proxy — limity a akce pro `anonymous_rate_limits`. */

export const MAPY_SUGGEST_RATE_LIMIT_PER_HOUR = 60;
export const MAPY_RGEOCODE_RATE_LIMIT_PER_HOUR = 20;

export const MAPY_SUGGEST_RATE_ACTION = "mapy_suggest";
export const MAPY_RGEOCODE_RATE_ACTION = "mapy_rgeocode";

export const MAPY_SUGGEST_MIN_QUERY_LENGTH = 2;
export const MAPY_SUGGEST_MAX_QUERY_LENGTH = 120;

/**
 * Process-local LRU. Na Vercelu instance nemají afinitu a recyklují se —
 * hit rate v produkci bude nízký. Hlavní pojistka je hodinový rate limit, ne cache.
 */
export const MAPY_SUGGEST_CACHE_TTL_MS = 10 * 60 * 1000;
export const MAPY_SUGGEST_CACHE_MAX_ENTRIES = 200;

export const MAPY_RATE_LIMIT_ERROR =
  "Příliš mnoho požadavků na lokalitu. Zkuste to za chvíli.";
export const MAPY_SERVICE_UNAVAILABLE_ERROR =
  "Našeptávač lokality teď není dostupný. Zkuste to za chvíli.";
