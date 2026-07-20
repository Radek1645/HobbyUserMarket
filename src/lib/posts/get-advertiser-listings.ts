import { HOME_LISTINGS_LIMIT } from "@/config/app";
import { createClient } from "@/lib/supabase/server";
import type { PublicListingPreview } from "@/types/post";

export async function fetchAdvertiserListings(
  nickname: string,
  page: number,
): Promise<PublicListingPreview[]> {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const offset = (safePage - 1) * HOME_LISTINGS_LIMIT;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_advertiser_listings", {
    p_nickname: nickname,
    p_limit: HOME_LISTINGS_LIMIT,
    p_offset: offset,
  });

  if (error) {
    console.error("fetchAdvertiserListings:", error);
    return [];
  }

  return (data ?? []) as PublicListingPreview[];
}
