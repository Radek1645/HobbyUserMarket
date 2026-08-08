import { GUEST_VISITOR_COOKIE } from "@/config/guest-listing";
import { isGuestVisitorId } from "@/lib/guest/visitor-id";
import { createHash } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Vrátí / vytvoří visitor cookie pro guest AI staging.
 * Volat jen ze Server Action / Route Handler — ne z RSC renderu.
 */
export async function ensureGuestVisitorId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(GUEST_VISITOR_COOKIE)?.value?.trim() ?? "";
  if (isGuestVisitorId(existing)) {
    return existing;
  }

  const visitorId = crypto.randomUUID();
  jar.set(GUEST_VISITOR_COOKIE, visitorId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return visitorId;
}

export async function readGuestVisitorId(): Promise<string | null> {
  const jar = await cookies();
  const value = jar.get(GUEST_VISITOR_COOKIE)?.value?.trim() ?? "";
  return isGuestVisitorId(value) ? value : null;
}

/** Podepíše visitor ID pro Edge; klient pak nemůže rotovat visitor limit. */
export function signGuestVisitorId(visitorId: string): string {
  const salt = process.env.ANONYMOUS_RATE_LIMIT_SALT?.trim();
  if (!salt) {
    throw new Error("Chybí ANONYMOUS_RATE_LIMIT_SALT pro guest flow.");
  }
  return createHash("sha256")
    .update(`${salt}:guest-visitor:${visitorId}`)
    .digest("hex");
}
