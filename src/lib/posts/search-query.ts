import {
  SEARCH_QUERY_MAX_LENGTH,
  SEARCH_QUERY_MIN_LENGTH,
} from "@/config/app";

export { SEARCH_QUERY_MAX_LENGTH, SEARCH_QUERY_MIN_LENGTH };

/** Normalizace dotazu z URL / formuláře. */
export function normalizeSearchQuery(raw: string | null | undefined): string {
  return (raw ?? "").trim().slice(0, SEARCH_QUERY_MAX_LENGTH);
}

export function isSearchQueryValid(query: string): boolean {
  return query.length >= SEARCH_QUERY_MIN_LENGTH;
}
