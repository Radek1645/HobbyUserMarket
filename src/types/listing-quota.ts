export type ListingQuotaSnapshot = {
  planLabel: string;
  usedCount: number;
  totalLimit: number;
  remaining: number;
};

export type ListingPackageCatalogItem = {
  slug: string;
  displayName: string;
  listingQuota: number;
  priceCents: number | null;
  description: string | null;
  isPurchasable: boolean;
};
