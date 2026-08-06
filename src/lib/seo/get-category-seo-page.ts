import type { CategorySeoPageRow } from "@/config/category-seo";
import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import { cache } from "react";

export const getCategorySeoPage = cache(
  async (slug: string): Promise<CategorySeoPageRow | null> => {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("category_seo_pages")
      .select(
        "slug, kind, description, meta_title, meta_description, index_status, listing_count, above_threshold_since, below_threshold_since, updated_at",
      )
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      console.error("getCategorySeoPage:", error);
      return null;
    }

    return data as CategorySeoPageRow | null;
  },
);

/** Indexované landings pro sitemapu. */
export async function getIndexedCategorySeoPaths(): Promise<
  { path: string; lastModified: Date }[]
> {
  const supabase = createPublicClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("category_seo_pages")
    .select("slug, updated_at")
    .eq("index_status", "index");

  if (error || !data) {
    console.error("getIndexedCategorySeoPaths:", error);
    return [];
  }

  return data.map((row) => ({
    path: `/${row.slug}`,
    lastModified: new Date(row.updated_at),
  }));
}
