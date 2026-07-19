/** Timeout pro volání Gemini/OpenAI (P9) — UI slibuje ~15 s, Edge má rezervu. */
export const AI_MODERATION_FETCH_TIMEOUT_MS = 25_000;

export function isFetchTimeoutError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return error.name === "TimeoutError" || error.name === "AbortError";
}

/** `fetch` s `AbortSignal.timeout` — při vypršení vyhodí TimeoutError/AbortError. */
export async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs = AI_MODERATION_FETCH_TIMEOUT_MS,
): Promise<Response> {
  return fetch(url, {
    ...init,
    signal: AbortSignal.timeout(timeoutMs),
  });
}
