import {
  NEW_OAUTH_REGISTRATION_WINDOW_MS,
  PENDING_REGISTRATION_METADATA_KEY,
  REGISTERED_CONVERSION_QUERY,
} from "@/config/meta-pixel";
import { readAvatarUrlFromMetadata } from "@/lib/auth/avatar-url";
import { flushPendingOAuthRegistrationConsents } from "@/lib/auth/oauth-registration-consents";
import { flushPendingRegistrationConsents } from "@/lib/auth/persist-registration-consents";
import { isPlaceholderNickname } from "@/lib/auth/nickname";
import { sanitizeInternalPath } from "@/lib/auth/sanitize-internal-path";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Přidá / přepíše query param na interní cestě (zachová pathname + ostatní search). */
export function appendInternalQueryParam(
  path: string,
  key: string,
  value: string,
): string {
  try {
    const parsed = new URL(path, "http://local");
    parsed.searchParams.set(key, value);
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return path;
  }
}

function isFreshOAuthRegistration(
  user: {
    app_metadata?: Record<string, unknown>;
    created_at?: string;
  },
): boolean {
  const provider = String(user.app_metadata?.provider ?? "");
  if (!provider || provider === "email") {
    return false;
  }
  const createdAt = Date.parse(String(user.created_at ?? ""));
  return (
    Number.isFinite(createdAt) &&
    Date.now() - createdAt <= NEW_OAUTH_REGISTRATION_WINDOW_MS
  );
}

/**
 * Po úspěšném ověření session (PKCE / OTP) doplní profil a vrátí interní cestu
 * pro redirect (onboarding vs. původní `next`).
 * Onboarding zachová `next` (např. `/inzerat/novy?resume=1`).
 */
export async function resolvePostAuthNextPath(
  supabase: SupabaseClient,
  rawNext: string | null | undefined,
): Promise<string> {
  let next = sanitizeInternalPath(rawNext);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return next;
  }

  const metadata = user.user_metadata ?? {};
  const hasPendingEmailRegistration =
    metadata[PENDING_REGISTRATION_METADATA_KEY] === true;
  const shouldTrackRegistration =
    hasPendingEmailRegistration || isFreshOAuthRegistration(user);
  await flushPendingOAuthRegistrationConsents(supabase, user.id);
  await flushPendingRegistrationConsents(supabase, user.id, metadata);

  const freshAvatarUrl = readAvatarUrlFromMetadata(metadata);
  if (freshAvatarUrl) {
    await supabase
      .from("profiles")
      .update({ avatar_url: freshAvatarUrl })
      .eq("id", user.id);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("nickname")
    .eq("id", user.id)
    .maybeSingle<{ nickname: string }>();

  const needsOnboarding =
    !profile || isPlaceholderNickname(profile.nickname);

  if (
    needsOnboarding &&
    !next.startsWith("/onboarding") &&
    !next.startsWith("/auth/nastavit-heslo")
  ) {
    next = `/onboarding?next=${encodeURIComponent(next)}`;
  }

  // Pouze skutečně nový účet; placeholder nickname sám o sobě nestačí.
  if (needsOnboarding && shouldTrackRegistration) {
    next = appendInternalQueryParam(next, REGISTERED_CONVERSION_QUERY, "1");
  }

  if (hasPendingEmailRegistration) {
    await supabase.auth.updateUser({
      data: { [PENDING_REGISTRATION_METADATA_KEY]: null },
    });
  }

  return next;
}
