export class MapyApiError extends Error {
  constructor(
    readonly code:
      | "missing_key"
      | "network"
      | "http"
      | "empty"
      | "rate_limit",
    message: string,
  ) {
    super(message);
    this.name = "MapyApiError";
  }
}

export function isAbortError(err: unknown): boolean {
  return err instanceof Error && err.name === "AbortError";
}
