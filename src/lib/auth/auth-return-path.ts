import { sanitizeInternalPath } from "@/lib/auth/sanitize-internal-path";
import { readGuestListingDraft } from "@/lib/guest/listing-draft";
import { GUEST_LISTING_RESUME_QUERY } from "@/config/guest-listing";

const AUTH_RETURN_PATH_KEY = "zapikolou:auth_return_path:v1";

const GUEST_RESUME_PATH = `/inzerat/novy?${GUEST_LISTING_RESUME_QUERY}=1`;

function isUsableReturnPath(path: string): boolean {
  return (
    path !== "/" &&
    !path.startsWith("/login") &&
    !path.startsWith("/onboarding") &&
    !path.startsWith("/auth/")
  );
}

/** Uloží cíl po loginu (přežije Back z Google account chooseru). */
export function storeAuthReturnPath(path: string): void {
  if (typeof window === "undefined") return;
  const safe = sanitizeInternalPath(path);
  if (!isUsableReturnPath(safe)) return;
  try {
    sessionStorage.setItem(AUTH_RETURN_PATH_KEY, safe);
  } catch {
    /* private mode / quota */
  }
}

function readStoredAuthReturnPath(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(AUTH_RETURN_PATH_KEY);
    if (!raw) return null;
    const safe = sanitizeInternalPath(raw);
    return isUsableReturnPath(safe) ? safe : null;
  } catch {
    return null;
  }
}

export function clearAuthReturnPath(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(AUTH_RETURN_PATH_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Preferuje `next` z URL; jinak sessionStorage; jinak guest draft → resume.
 * Volat jen v klientovi.
 */
export function resolveAuthReturnPath(urlNext: string | null | undefined): string {
  const fromUrl = sanitizeInternalPath(urlNext);
  if (isUsableReturnPath(fromUrl)) {
    storeAuthReturnPath(fromUrl);
    return fromUrl;
  }

  const stored = readStoredAuthReturnPath();
  if (stored) {
    return stored;
  }

  if (readGuestListingDraft()) {
    storeAuthReturnPath(GUEST_RESUME_PATH);
    return GUEST_RESUME_PATH;
  }

  return fromUrl;
}
