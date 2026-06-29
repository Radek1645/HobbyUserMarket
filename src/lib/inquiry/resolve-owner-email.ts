import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * E-mail zadavatele pro poptávkový formulář.
 * 1) RPC get_inquiry_recipient_email (SECURITY DEFINER)
 * 2) profiles.email
 * 3) auth.admin.getUserById
 */
export async function resolveOwnerEmail(
  admin: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data: rpcEmail, error: rpcError } = await admin.rpc(
    "get_inquiry_recipient_email",
    { p_user_id: userId },
  );

  if (rpcError) {
    console.error("inquiry rpc email lookup:", rpcError);
  } else if (typeof rpcEmail === "string" && rpcEmail.trim()) {
    return rpcEmail.trim();
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .maybeSingle<{ email: string | null }>();

  if (profileError) {
    console.error("inquiry profile lookup:", profileError);
  }

  const profileEmail = profile?.email?.trim();
  if (profileEmail) {
    return profileEmail;
  }

  const { data: authData, error: authError } =
    await admin.auth.admin.getUserById(userId);

  if (authError) {
    console.error("inquiry auth user lookup:", authError);
    return null;
  }

  return authData.user?.email?.trim() ?? null;
}
