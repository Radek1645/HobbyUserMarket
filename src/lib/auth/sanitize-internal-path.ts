const DEFAULT_INTERNAL_PATH = "/";

/**
 * Bezpečný interní redirect po přihlášení — pouze relativní cesta na stejném webu.
 * Odmítá protocol-relative URL (`//evil.com`), backslash a absolutní URL.
 */
export function sanitizeInternalPath(
  raw: string | null | undefined,
): string {
  const value = String(raw ?? "").trim();
  if (!value) {
    return DEFAULT_INTERNAL_PATH;
  }

  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    value.includes("\0")
  ) {
    return DEFAULT_INTERNAL_PATH;
  }

  try {
    const parsed = new URL(value, "http://local");
    if (parsed.pathname.startsWith("//")) {
      return DEFAULT_INTERNAL_PATH;
    }
    const path = `${parsed.pathname}${parsed.search}${parsed.hash}`;
    return path.startsWith("/") ? path : DEFAULT_INTERNAL_PATH;
  } catch {
    return DEFAULT_INTERNAL_PATH;
  }
}
