import { LLMS_TXT_LISTINGS_LIMIT } from "@/config/llms-txt";
import { getListingPath } from "@/lib/posts/listing-path";
import { createPublicClient } from "@/lib/supabase/public";

export type LlmsListing = {
  title: string;
  path: string;
};

/** Nejnovější aktivní inzeráty pro `/llms.txt` (s titulem pro agenty). */
export async function getLlmsListings(): Promise<LlmsListing[]> {
  const supabase = createPublicClient();
  if (!supabase) return [];

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("posts")
    .select("slug, title")
    .eq("status", "active")
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order("updated_at", { ascending: false })
    .limit(LLMS_TXT_LISTINGS_LIMIT);

  if (error || !data) {
    console.error("llms.txt listings:", error);
    return [];
  }

  return data.map((row) => ({
    title: row.title?.trim() || row.slug,
    path: getListingPath(row.slug),
  }));
}
