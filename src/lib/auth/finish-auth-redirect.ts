import { readAvatarUrlFromMetadata } from "@/lib/auth/avatar-url";
import { flushPendingRegistrationConsents } from "@/lib/auth/persist-registration-consents";
import { isPlaceholderNickname } from "@/lib/auth/nickname";
import { sanitizeInternalPath } from "@/lib/auth/sanitize-internal-path";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Po úspěšném ověření session (PKCE / OTP) doplní profil a vrátí interní cestu
 * pro redirect (onboarding vs. původní `next`).
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
    next = "/onboarding";
  }

  return next;
}
