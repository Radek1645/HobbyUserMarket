import { HOME_LISTINGS_FETCH_LIMIT } from "@/config/app";
import { createClient } from "@/lib/supabase/server";
import type { PublicListingPreview } from "@/types/post";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cache } from "react";

/**
 * Veřejné aktivní inzeráty pro goods subcategory landing.
 * Homepagové RPC filtrují jen category_type — tady potřebujeme subcategory_slug.
 */
export const fetchCategorySeoListings = cache(
  async (subcategorySlug: string): Promise<PublicListingPreview[]> => {
    const supabase = await createClient();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("posts")
      .select(
        "id, title, description, category_type, subcategory_slug, price_type, price_amount, location_text, slug, main_image_url, event_date, event_end_date, created_at",
      )
      .eq("subcategory_slug", subcategorySlug)
      .eq("status", "active")
      .eq("is_private", false)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order("created_at", { ascending: false })
      .limit(HOME_LISTINGS_FETCH_LIMIT);

    if (error) {
      console.error("fetchCategorySeoListings:", error);
      return [];
    }

    return (data ?? []) as PublicListingPreview[];
  },
);

/** Počet veřejně viditelných inzerátů per subcategory (pro denní job). */
export async function countActiveListingsBySubcategorySlug(
  subcategorySlug: string,
  admin: SupabaseClient,
): Promise<number> {
  const now = new Date().toISOString();

  const { count, error } = await admin
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("subcategory_slug", subcategorySlug)
    .eq("status", "active")
    .eq("is_private", false)
    .or(`expires_at.is.null,expires_at.gt.${now}`);

  if (error) {
    console.error("countActiveListingsBySubcategorySlug:", error);
    return 0;
  }

  return count ?? 0;
}
