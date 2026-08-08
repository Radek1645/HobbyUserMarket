import { sanitizeInternalPath } from "@/lib/auth/sanitize-internal-path";
import { cookies } from "next/headers";

/** HttpOnly cookie — cíl po OAuth (přežije Back z Google account chooseru). */
export const PENDING_AUTH_RETURN_PATH_COOKIE = "pending_auth_return_path";

const COOKIE_MAX_AGE_SEC = 30 * 60;

function isUsableAuthReturnPath(path: string): boolean {
  return (
    path !== "/" &&
    !path.startsWith("/login") &&
    !path.startsWith("/onboarding") &&
    !path.startsWith("/auth/")
  );
}

/** Uloží cíl jen když je použitelný — `/` nepřepíše dřívější resume cestu. */
export async function storePendingAuthReturnPath(path: string): Promise<void> {
  const safe = sanitizeInternalPath(path);
  if (!isUsableAuthReturnPath(safe)) {
    return;
  }

  const jar = await cookies();
  jar.set(PENDING_AUTH_RETURN_PATH_COOKIE, safe, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SEC,
  });
}

export async function readPendingAuthReturnPath(): Promise<string | null> {
  const jar = await cookies();
  const raw = jar.get(PENDING_AUTH_RETURN_PATH_COOKIE)?.value?.trim() ?? "";
  if (!raw) {
    return null;
  }
  const safe = sanitizeInternalPath(raw);
  return isUsableAuthReturnPath(safe) ? safe : null;
}

export async function clearPendingAuthReturnPath(): Promise<void> {
  const jar = await cookies();
  jar.delete(PENDING_AUTH_RETURN_PATH_COOKIE);
}

/**
 * Preferuje `next` z URL; jinak cookie z předchozího OAuth pokusu.
 * Cookie nemaže — volej `clearPendingAuthReturnPath` až po úspěšné session.
 */
export async function resolveAuthReturnPathFromRequest(
  rawNext: string | null | undefined,
): Promise<string> {
  const fromUrl = sanitizeInternalPath(rawNext);
  if (isUsableAuthReturnPath(fromUrl)) {
    return fromUrl;
  }

  const fromCookie = await readPendingAuthReturnPath();
  return fromCookie ?? fromUrl;
}
