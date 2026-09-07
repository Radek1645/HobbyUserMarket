import type { PostStatus } from "@/types/post";

/** Inzerát je po datu expirace (veřejně neviditelný přes is_post_publicly_visible). */
export function isListingExpired(
  expiresAt: string | null,
  now: Date = new Date(),
): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() <= now.getTime();
}

/**
 * Stav pro badge a akce v /moje-inzeraty.
 * active/hidden + expires_at <= now() → archived (PRD §4.1, P4).
 */
export function getOwnerDisplayStatus(
  status: PostStatus,
  expiresAt: string | null,
  now: Date = new Date(),
): PostStatus {
  if (
    (status === "active" || status === "hidden") &&
    isListingExpired(expiresAt, now)
  ) {
    return "archived";
  }
  return status;
}

export function isListingExpiredOrArchived(
  status: PostStatus,
  expiresAt: string | null,
  now: Date = new Date(),
): boolean {
  return getOwnerDisplayStatus(status, expiresAt, now) === "archived";
}
