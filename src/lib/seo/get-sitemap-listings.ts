import { getListingPath } from "@/lib/posts/listing-path";
import { createPublicClient } from "@/lib/supabase/public";

export type SitemapListing = {
  path: string;
  lastModified: Date;
};

export async function getSitemapListings(): Promise<SitemapListing[]> {
  const supabase = createPublicClient();
  if (!supabase) return [];

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("posts")
    .select("slug, updated_at")
    .eq("status", "active")
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order("updated_at", { ascending: false });

  if (error || !data) {
    console.error("sitemap listings:", error);
    return [];
  }

  return data.map((row) => ({
    path: getListingPath(row.slug),
    lastModified: new Date(row.updated_at),
  }));
}
