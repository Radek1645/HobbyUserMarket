/**
 * Povolené hostname / Origin pro prohlížečové POST (SEC-M02 / GO-6) a Turnstile hostname.
 * Jediný zdroj pravdy — `config/turnstile.ts` re-exportuje jako TURNSTILE_STABLE_HOSTNAMES.
 * Nechrání proti curl — Origin jde zfalšovat; na to je rate limit + CAPTCHA.
 */

import { SITE_DOMAIN } from "@/config/site";

/**
 * Stabilní hostname mimo `VERCEL_URL` (hash per deploy).
 * `local-market-pwa.vercel.app` neexistuje (404). Team/git aliasy jsou za SSO.
 */
export const STABLE_APP_HOSTNAMES = [
  SITE_DOMAIN,
  `www.${SITE_DOMAIN}`,
  "local-market-pwa-rho-team-1.vercel.app",
  "local-market-pwa-git-main-rho-team-1.vercel.app",
] as const;

export function normalizeHostname(raw: string | null | undefined): string | null {
  const host = raw
    ?.trim()
    .replace(/^https?:\/\//, "")
    .split("/")[0]
    ?.toLowerCase();
  return host || null;
}

/**
 * Hostname whitelist pro produkci. Mimo produkci `null` = kontrolu Origin přeskoč
 * (localhost / `next dev`).
 */
export function resolveAllowedHostnames(): Set<string> | null {
  if (process.env.NODE_ENV !== "production") {
    return null;
  }

  const hostnames = new Set<string>();
  for (const host of STABLE_APP_HOSTNAMES) {
    hostnames.add(host.toLowerCase());
  }

  for (const raw of [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_URL,
    process.env.VERCEL_BRANCH_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
  ]) {
    const host = normalizeHostname(raw);
    if (host) hostnames.add(host);
  }

  return hostnames;
}

export function hostnameFromOriginOrReferer(
  request: Request,
): string | null {
  const origin = request.headers.get("origin");
  if (origin && origin !== "null") {
    try {
      return normalizeHostname(new URL(origin).host);
    } catch {
      return null;
    }
  }

  const referer = request.headers.get("referer");
  if (!referer) return null;
  try {
    return normalizeHostname(new URL(referer).host);
  } catch {
    return null;
  }
}

/** Media type z Content-Type (bez parametrů). */
export function parseMediaType(contentType: string | null): string | null {
  if (!contentType) return null;
  const mediaType = contentType.split(";")[0]?.trim().toLowerCase();
  return mediaType || null;
}
