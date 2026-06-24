import { createClient } from "@/lib/supabase/server";
import type { AppUser } from "@/types/auth";

export async function getCurrentUser(): Promise<AppUser | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return null;
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id, email, full_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const metadata = user.user_metadata ?? {};

  return {
    id: user.id,
    email: profile?.email ?? user.email,
    fullName:
      profile?.full_name ??
      metadata.full_name ??
      metadata.name ??
      null,
    avatarUrl:
      profile?.avatar_url ??
      metadata.avatar_url ??
      metadata.picture ??
      null,
  };
}
