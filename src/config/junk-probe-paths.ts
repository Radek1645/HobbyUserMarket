/**
 * Cesty, které nikdy neobsluhujeme.
 * Crawler/scanner by jinak prošel middleware a catch-all `[slug]` (SSR 404).
 * Anonymní `getUser()` Auth API nevolá — úspora je invocation + render, ne Supabase.
 */

export const JUNK_PROBE_PATHS_EXACT = [
  "/meta.json",
  "/wp-login.php",
  "/xmlrpc.php",
  "/.env",
  "/.env.local",
  "/.git/config",
] as const;

export const JUNK_PROBE_PATH_PREFIXES = [
  "/.git",
  "/wp-admin",
  "/wp-json",
  "/wp-content",
] as const;

const JUNK_PROBE_PATHS_EXACT_SET: ReadonlySet<string> = new Set(
  JUNK_PROBE_PATHS_EXACT,
);

function normalizeProbePathname(pathname: string): string {
  const lower = pathname.toLowerCase();
  if (lower.length > 1 && lower.endsWith("/")) {
    return lower.replace(/\/+$/, "") || "/";
  }
  return lower;
}

export function isJunkProbePath(pathname: string): boolean {
  const normalized = normalizeProbePathname(pathname);
  if (JUNK_PROBE_PATHS_EXACT_SET.has(normalized)) {
    return true;
  }
  return JUNK_PROBE_PATH_PREFIXES.some(
    (prefix) =>
      normalized === prefix || normalized.startsWith(`${prefix}/`),
  );
}
