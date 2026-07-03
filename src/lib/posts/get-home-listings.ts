import {
  HOME_LISTINGS_FETCH_LIMIT,
} from "@/config/app";
import type { HomeBrowseCategory } from "@/config/home-themes";
import { createClient } from "@/lib/supabase/server";
import type { PublicListingPreview } from "@/types/post";
import { cache } from "react";

export type HomeListingsInitialData = {
  listings: PublicListingPreview[];
  category: HomeBrowseCategory;
};

export const fetchHomeRecentListings = cache(
  async (category: HomeBrowseCategory): Promise<HomeListingsInitialData> => {
    const supabase = await createClient();
    const rpcCategory = category === "all" ? null : category;

    const { data, error } = await supabase.rpc("get_recent_posts", {
      p_limit: HOME_LISTINGS_FETCH_LIMIT,
      p_category_type: rpcCategory,
    });

    if (error) {
      console.error("fetchHomeRecentListings:", error);
      return { listings: [], category };
    }

    return {
      listings: (data ?? []) as PublicListingPreview[],
      category,
    };
  },
);
