/** Cloudflare Turnstile — veřejný site key, akce a hlášky (SEC-M09). */

import { SITE_DOMAIN } from "@/config/site";

export const TURNSTILE_ACTION = {
  INQUIRY: "inquiry",
  RESEND_SIGNUP_VERIFICATION: "resend_signup_verification",
} as const;

export type TurnstileAction =
  (typeof TURNSTILE_ACTION)[keyof typeof TURNSTILE_ACTION];

/** Cloudflare token má maximálně 2048 znaků. */
export const TURNSTILE_TOKEN_MAX_LENGTH = 2048;

/** Siteverify nesmí držet Next.js request až do platformního timeoutu. */
export const TURNSTILE_VERIFY_TIMEOUT_MS = 10_000;

/**
 * Stabilní hostname mimo `VERCEL_URL` (ten je hash per deploy).
 * `local-market-pwa.vercel.app` neexistuje (404). Team/git aliasy jsou za SSO.
 */
export const TURNSTILE_STABLE_HOSTNAMES = [
  SITE_DOMAIN,
  `www.${SITE_DOMAIN}`,
  "local-market-pwa-rho-team-1.vercel.app",
  "local-market-pwa-git-main-rho-team-1.vercel.app",
] as const;

export function resolveTurnstileSiteKey(): string | null {
  const key = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  return key || null;
}

export const TURNSTILE_REQUIRED_ERROR = "Potvrďte, že nejste robot.";

export const TURNSTILE_FAILED_ERROR =
  "Ověření proti spamu selhalo. Zkuste to znovu.";

export const TURNSTILE_UNAVAILABLE_ERROR =
  "Ochrana proti spamu není dostupná. Zkuste to později.";
