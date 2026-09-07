import { sanitizeInternalPath } from "@/lib/auth/sanitize-internal-path";

const LOCATION_KEY = "zapikolou:in-app-location";
const PREVIOUS_LOCATION_KEY = "zapikolou:in-app-previous-location";

function pathnameOf(path: string): string {
  const q = path.indexOf("?");
  const h = path.indexOf("#");
  let end = path.length;
  if (q !== -1) end = Math.min(end, q);
  if (h !== -1) end = Math.min(end, h);
  return path.slice(0, end) || "/";
}

function isAuthOrOnboardingPath(path: string): boolean {
  const pathname = pathnameOf(path);
  return (
    pathname.startsWith("/login") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/auth/")
  );
}

function isUsableBackPath(path: string, currentPathname: string): boolean {
  if (isAuthOrOnboardingPath(path)) return false;
  return pathnameOf(path) !== currentPathname;
}

function readSession(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeSession(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    /* private mode / quota */
  }
}

/** Volá se při každé in-app navigaci — předchozí cesta slouží tlačítku Zpět. */
export function rememberInAppLocation(path: string): void {
  const safe = sanitizeInternalPath(path);
  const previous = readSession(LOCATION_KEY);
  if (previous && previous !== safe) {
    writeSession(PREVIOUS_LOCATION_KEY, previous);
  }
  writeSession(LOCATION_KEY, safe);
}

function readRememberedBackPath(currentPathname: string): string | null {
  const currentStored = readSession(LOCATION_KEY);
  if (currentStored) {
    const safe = sanitizeInternalPath(currentStored);
    // Remember ještě neběžel — v klíči je pořád stránka, ze které jsme přišli.
    if (isUsableBackPath(safe, currentPathname)) {
      return safe;
    }
  }
  const previous = readSession(PREVIOUS_LOCATION_KEY);
  if (previous) {
    const safe = sanitizeInternalPath(previous);
    if (isUsableBackPath(safe, currentPathname)) {
      return safe;
    }
  }
  return null;
}

function sameOriginReferrerPath(
  referrer: string,
  currentOrigin: string,
  currentPathname: string,
): string | null {
  if (!referrer) return null;
  let url: URL;
  try {
    url = new URL(referrer);
  } catch {
    return null;
  }
  if (url.origin !== currentOrigin) return null;
  const raw = `${url.pathname}${url.search}${url.hash}`;
  const safe = sanitizeInternalPath(raw);
  if (safe === "/" && url.pathname !== "/") return null;
  if (!isUsableBackPath(safe, currentPathname)) return null;
  return safe;
}

/**
 * Interní cíl pro Zpět: zapamatovaná stránka v tabu, jinak same-origin referrer,
 * jinak fallback (přímý vstup / Google). Nikdy ne `history.back()` — v nové kartě
 * by to mohlo opustit web.
 */
export function resolveInAppBackHref(input: {
  currentPathname: string;
  fallbackHref: string;
  referrer: string;
  currentOrigin: string;
}): string {
  const fromMemory = readRememberedBackPath(input.currentPathname);
  if (fromMemory) return fromMemory;

  const fromReferrer = sameOriginReferrerPath(
    input.referrer,
    input.currentOrigin,
    input.currentPathname,
  );
  if (fromReferrer) return fromReferrer;

  return sanitizeInternalPath(input.fallbackHref);
}
