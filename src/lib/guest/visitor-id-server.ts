import { GUEST_VISITOR_COOKIE } from "@/config/guest-listing";
import { assertGuestVisitorMintRateLimit } from "@/lib/guest/anonymous-rate-limit";
import { isGuestVisitorId } from "@/lib/guest/visitor-id";
import { readClientIpFromHeaders } from "@/lib/security/client-ip";
import { createHash } from "node:crypto";
import { cookies, headers } from "next/headers";

export type GuestVisitorEnsureResult =
  | { ok: true; visitorId: string }
  | { ok: false; error: string };

/**
 * Vrátí / vytvoří visitor cookie pro guest AI staging.
 * Nové ID se počítá do IP mint limitu; existující cookie se jen přečte.
 * Volat jen ze Server Action / Route Handler — ne z RSC renderu.
 */
export async function ensureGuestVisitorId(): Promise<GuestVisitorEnsureResult> {
  const jar = await cookies();
  const existing = jar.get(GUEST_VISITOR_COOKIE)?.value?.trim() ?? "";
  if (isGuestVisitorId(existing)) {
    return { ok: true, visitorId: existing };
  }

  const ipAddress = readClientIpFromHeaders(await headers());
  const mint = await assertGuestVisitorMintRateLimit(ipAddress);
  if (!mint.ok) {
    return mint;
  }

  const visitorId = crypto.randomUUID();
  jar.set(GUEST_VISITOR_COOKIE, visitorId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return { ok: true, visitorId };
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
