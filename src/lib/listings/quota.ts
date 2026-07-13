import { createClient } from "@/lib/supabase/server";
import { LISTING_UPSELL_PACKAGE_SLUG } from "@/config/app";
import { MONETIZATION_ENABLED } from "@/config/monetization";
import type {
  ListingPackageCatalogItem,
  ListingQuotaSnapshot,
} from "@/types/listing-quota";

export {
  formatPackagePrice,
  isListingQuotaExceededError,
  isNewPublicationQuotaBlocked,
  LISTING_QUOTA_EXCEEDED_MESSAGE,
} from "@/lib/listings/quota-shared";

type QuotaRow = {
  plan_label: string;
  used_count: number;
  total_limit: number;
  remaining: number;
};

type PackageRow = {
  slug: string;
  display_name: string;
  listing_quota: number;
  price_cents: number | null;
  description: string | null;
  is_purchasable: boolean;
};

export async function getUserListingQuota(
  userId: string,
): Promise<ListingQuotaSnapshot | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_user_listing_quota", {
    p_user_id: userId,
  });

  if (error) {
    console.error("get_user_listing_quota:", error);
    return null;
  }

  const row = (Array.isArray(data) ? data[0] : data) as QuotaRow | undefined;
  if (!row) return null;

  return {
    planLabel: row.plan_label,
    usedCount: row.used_count,
    totalLimit: row.total_limit,
    remaining: row.remaining,
  };
}

export async function getListingQuotasForUsers(
  userIds: string[],
): Promise<Map<string, ListingQuotaSnapshot>> {
  if (userIds.length === 0) return new Map();

  const supabase = await createClient();
  const results = await Promise.all(
    userIds.map(async (userId) => {
      const { data, error } = await supabase.rpc("get_user_listing_quota", {
        p_user_id: userId,
      });

      if (error) {
        console.error("get_user_listing_quota:", userId, error);
        return [userId, null] as const;
      }

      const row = (Array.isArray(data) ? data[0] : data) as
        | QuotaRow
        | undefined;
      if (!row) return [userId, null] as const;

      return [
        userId,
        {
          planLabel: row.plan_label,
          usedCount: row.used_count,
          totalLimit: row.total_limit,
          remaining: row.remaining,
        },
      ] as const;
    }),
  );

  return new Map(
    results.filter((entry): entry is [string, ListingQuotaSnapshot] =>
      entry[1] !== null,
    ),
  );
}

export async function getListingUpsellPackage(): Promise<ListingPackageCatalogItem | null> {
  if (!MONETIZATION_ENABLED) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listing_packages")
    .select(
      "slug, display_name, listing_quota, price_cents, description, is_purchasable",
    )
    .eq("is_active", true)
    .eq("slug", LISTING_UPSELL_PACKAGE_SLUG)
    .maybeSingle<PackageRow>();

  if (error || !data) {
    if (error) console.error("listing_packages upsell:", error);
    return null;
  }

  return {
    slug: data.slug,
    displayName: data.display_name,
    listingQuota: data.listing_quota,
    priceCents: data.price_cents,
    description: data.description,
    isPurchasable: data.is_purchasable,
  };
}
