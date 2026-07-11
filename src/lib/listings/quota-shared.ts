import type { ListingQuotaSnapshot } from "@/types/listing-quota";

/** Bez server importů — safe pro Client Components. */

export const LISTING_QUOTA_EXCEEDED_MESSAGE =
  "Dosáhli jste limitu publikovaných inzerátů. Smazání nebo archivace starého inzerátu kredit nevrátí — další publikaci získáte dokoupením balíčku v nastavení profilu.";

export function isListingQuotaExceededError(message?: string | null): boolean {
  return Boolean(message?.includes("listing_quota_exceeded"));
}

/** Blokuje novou publikaci (create nebo první publish draftu) — ne re-moderaci už spotřebovaného inzerátu. */
export function isNewPublicationQuotaBlocked(
  quota: ListingQuotaSnapshot | null,
  listingQuotaConsumed = false,
): boolean {
  if (!quota || quota.remaining > 0) return false;
  return !listingQuotaConsumed;
}

export function formatPackagePrice(priceCents: number | null): string | null {
  if (priceCents == null) return null;
  return `${Math.round(priceCents / 100)} Kč`;
}
