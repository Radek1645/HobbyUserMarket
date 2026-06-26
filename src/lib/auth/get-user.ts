import { createClient } from "@/lib/supabase/server";
import type { AppUser, UserRole } from "@/types/auth";

type ProfileRow = {
  id: string;
  email: string | null;
  nickname: string;
  name: string | null;
  surname: string | null;
  avatar_url: string | null;
  role: UserRole;
};

function isPlaceholderNickname(nickname: string): boolean {
  return nickname.startsWith("user_");
}

function buildDisplayName(
  name: string | null,
  nickname: string,
  metadata: Record<string, unknown>
): string {
  if (name?.trim()) {
    return name.trim();
  }

  const metaName =
    (typeof metadata.full_name === "string" && metadata.full_name) ||
    (typeof metadata.name === "string" && metadata.name) ||
    null;

  if (metaName?.trim()) {
    return metaName.trim();
  }

  return nickname;
}

export async function getCurrentUser(): Promise<AppUser | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, nickname, name, surname, avatar_url, role")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  const metadata = user.user_metadata ?? {};

  if (!profile) {
    const metaName =
      (typeof metadata.full_name === "string" && metadata.full_name) ||
      (typeof metadata.name === "string" && metadata.name) ||
      null;

    return {
      id: user.id,
      email: user.email,
      nickname: metaName?.trim() ?? user.email.split("@")[0] ?? "uzivatel",
      name: metaName,
      surname: null,
      avatarUrl:
        (typeof metadata.avatar_url === "string" && metadata.avatar_url) ||
        (typeof metadata.picture === "string" && metadata.picture) ||
        null,
      role: "user",
      displayName: metaName?.trim() ?? user.email,
      needsNicknameSetup: true,
    };
  }

  const avatarUrl =
    profile.avatar_url ??
    (typeof metadata.avatar_url === "string" ? metadata.avatar_url : null) ??
    (typeof metadata.picture === "string" ? metadata.picture : null);

  const nickname = profile.nickname;

  return {
    id: profile.id,
    email: profile.email ?? user.email,
    nickname,
    name: profile.name,
    surname: profile.surname,
    avatarUrl,
    role: profile.role,
    displayName: buildDisplayName(profile.name, nickname, metadata),
    needsNicknameSetup: isPlaceholderNickname(nickname),
  };
}
