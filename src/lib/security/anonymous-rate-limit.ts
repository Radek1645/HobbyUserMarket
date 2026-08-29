import { createHash } from "node:crypto";

export function currentHourlyRateLimitWindowStart(): string {
  const now = new Date();
  now.setMinutes(0, 0, 0);
  return now.toISOString();
}

/**
 * Denně rotující pseudonym pro rate limit; původní IP/e-mail se do DB neukládá.
 */
export function hashAnonymousRateLimitSubject(
  kind: "ip" | "visitor" | "email",
  value: string,
): string {
  const salt = process.env.ANONYMOUS_RATE_LIMIT_SALT?.trim();
  if (!salt) {
    throw new Error("RATE_LIMIT_UNAVAILABLE");
  }

  const day = new Date().toISOString().slice(0, 10);
  return `${kind}:${createHash("sha256")
    .update(`${salt}:${day}:${value}`)
    .digest("hex")}`;
}
