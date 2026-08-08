import { CURRENT_VOP_VERSION } from "@/config/legal";
import type { RegistrationConsentPayload } from "@/lib/auth/persist-registration-consents";
import { persistRegistrationConsentPayload } from "@/lib/auth/persist-registration-consents";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/** HttpOnly cookie — souhlasy z registrační záložky před Google OAuth. */
export const PENDING_OAUTH_CONSENTS_COOKIE = "pending_oauth_registration_consents";

const COOKIE_MAX_AGE_SEC = 15 * 60;

type CookiePayload = {
  marketing: boolean;
  vopVersion: string;
};

function parseCookiePayload(raw: string): RegistrationConsentPayload | null {
  try {
    const parsed = JSON.parse(raw) as CookiePayload;
    if (typeof parsed.marketing !== "boolean") {
      return null;
    }
    return {
      marketing: parsed.marketing,
      vopVersion:
        typeof parsed.vopVersion === "string" && parsed.vopVersion.trim()
          ? parsed.vopVersion.trim()
          : CURRENT_VOP_VERSION,
    };
  } catch {
    return null;
  }
}

/** Uloží souhlasy před redirectem na Google (registrace). */
export async function storePendingOAuthRegistrationConsents(
  payload: RegistrationConsentPayload,
): Promise<void> {
  const jar = await cookies();
  jar.set(PENDING_OAUTH_CONSENTS_COOKIE, JSON.stringify(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SEC,
  });
}

/** Po OAuth session — zapíše souhlasy do profilu a smaže cookie. */
export async function flushPendingOAuthRegistrationConsents(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const jar = await cookies();
  const raw = jar.get(PENDING_OAUTH_CONSENTS_COOKIE)?.value?.trim() ?? "";
  jar.delete(PENDING_OAUTH_CONSENTS_COOKIE);

  if (!raw) {
    return;
  }

  const payload = parseCookiePayload(raw);
  if (!payload) {
    return;
  }

  await persistRegistrationConsentPayload(supabase, userId, payload);
}
