/** OAuth metadata keys Supabase stores from Google and similar providers. */
export function readAvatarUrlFromMetadata(
  metadata: Record<string, unknown>,
): string | null {
  const picture = metadata.picture;
  if (typeof picture === "string" && picture.trim()) {
    return picture.trim();
  }

  const avatarUrl = metadata.avatar_url;
  if (typeof avatarUrl === "string" && avatarUrl.trim()) {
    return avatarUrl.trim();
  }

  return null;
}

/** Prefer fresh OAuth session metadata over a stale value saved in profiles. */
export function resolveAvatarUrl(
  metadata: Record<string, unknown>,
  profileAvatarUrl: string | null,
): string | null {
  return readAvatarUrlFromMetadata(metadata) ?? profileAvatarUrl;
}
