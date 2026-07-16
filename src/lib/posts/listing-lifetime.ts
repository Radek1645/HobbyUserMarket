import { LISTING_MAX_LIFETIME_DAYS } from "@/config/listing-lifetime";

/** Hard cap: created_at + LISTING_MAX_LIFETIME_DAYS. */
export function getListingLifetimeHardCap(
  createdAt: string | Date,
): Date {
  const created =
    typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  const hardCap = new Date(created.getTime());
  hardCap.setDate(hardCap.getDate() + LISTING_MAX_LIFETIME_DAYS);
  return hardCap;
}

/** Zbývá ještě lifetime pro prodloužení / obnovení. */
export function canExtendListingLifetime(
  createdAt: string | Date,
  expiresAt: string | null,
  now: Date = new Date(),
): boolean {
  const hardCap = getListingLifetimeHardCap(createdAt);
  if (hardCap.getTime() <= now.getTime()) return false;
  if (!expiresAt) return true;
  return hardCap.getTime() > new Date(expiresAt).getTime();
}

/** Ořízne cílové expires_at na hard cap; null pokud už nelze prodloužit. */
export function clampExpiresAtToLifetime(
  createdAt: string | Date,
  proposedExpiresAt: Date,
  now: Date = new Date(),
): Date | null {
  const hardCap = getListingLifetimeHardCap(createdAt);
  if (hardCap.getTime() <= now.getTime()) return null;
  return proposedExpiresAt.getTime() > hardCap.getTime()
    ? hardCap
    : proposedExpiresAt;
}
