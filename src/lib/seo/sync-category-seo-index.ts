import {
  CATEGORY_SEO_ENTER_HYSTERESIS_DAYS,
  CATEGORY_SEO_EXIT_HYSTERESIS_DAYS,
  CATEGORY_SEO_NATIONAL_THRESHOLD,
  type CategorySeoIndexStatus,
  type CategorySeoPageRow,
} from "@/config/category-seo";
import { createAdminClient } from "@/lib/supabase/admin";
import { countActiveListingsBySubcategorySlug } from "@/lib/seo/fetch-category-seo-listings";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function daysBetween(fromIso: string, to: Date): number {
  return (to.getTime() - new Date(fromIso).getTime()) / MS_PER_DAY;
}

export type CategorySeoSyncResult = {
  ok: boolean;
  updated: number;
  error?: string;
  pages?: {
    slug: string;
    listing_count: number;
    index_status: CategorySeoIndexStatus;
  }[];
};

/**
 * Denní přepočet listing_count + obousměrná hystereze → index_status.
 * generateMetadata jen čte hotový stav — netipuje tady.
 */
export async function syncCategorySeoIndexStatuses(): Promise<CategorySeoSyncResult> {
  const adminResult = createAdminClient();
  if (!adminResult.ok) {
    return { ok: false, updated: 0, error: adminResult.error };
  }

  const admin = adminResult.client;
  const now = new Date();

  const { data: pages, error: loadError } = await admin
    .from("category_seo_pages")
    .select(
      "slug, kind, description, meta_title, meta_description, index_status, listing_count, above_threshold_since, below_threshold_since, updated_at",
    );

  if (loadError || !pages) {
    console.error("syncCategorySeoIndexStatuses load:", loadError);
    return { ok: false, updated: 0, error: loadError?.message ?? "load failed" };
  }

  let updated = 0;
  const summary: CategorySeoSyncResult["pages"] = [];

  for (const page of pages as CategorySeoPageRow[]) {
    const listingCount = await countActiveListingsBySubcategorySlug(
      page.slug,
      admin,
    );
    const aboveThreshold = listingCount >= CATEGORY_SEO_NATIONAL_THRESHOLD;

    let aboveSince = page.above_threshold_since;
    let belowSince = page.below_threshold_since;
    let indexStatus: CategorySeoIndexStatus = page.index_status;

    if (aboveThreshold) {
      belowSince = null;
      if (!aboveSince) {
        aboveSince = now.toISOString();
      }
      if (
        indexStatus === "noindex" &&
        daysBetween(aboveSince, now) >= CATEGORY_SEO_ENTER_HYSTERESIS_DAYS
      ) {
        indexStatus = "index";
      }
    } else {
      aboveSince = null;
      if (!belowSince) {
        belowSince = now.toISOString();
      }
      if (
        indexStatus === "index" &&
        daysBetween(belowSince, now) >= CATEGORY_SEO_EXIT_HYSTERESIS_DAYS
      ) {
        indexStatus = "noindex";
      }
      // Ještě nikdy nebylo v indexu a jsme pod prahem → zůstat noindex
      if (indexStatus !== "index") {
        indexStatus = "noindex";
      }
    }

    const changed =
      listingCount !== page.listing_count ||
      indexStatus !== page.index_status ||
      aboveSince !== page.above_threshold_since ||
      belowSince !== page.below_threshold_since;

    if (changed) {
      const { error: updateError } = await admin
        .from("category_seo_pages")
        .update({
          listing_count: listingCount,
          index_status: indexStatus,
          above_threshold_since: aboveSince,
          below_threshold_since: belowSince,
          updated_at: now.toISOString(),
        })
        .eq("slug", page.slug);

      if (updateError) {
        console.error("syncCategorySeoIndexStatuses update:", page.slug, updateError);
        continue;
      }
      updated += 1;
    }

    summary.push({
      slug: page.slug,
      listing_count: listingCount,
      index_status: indexStatus,
    });
  }

  return { ok: true, updated, pages: summary };
}
