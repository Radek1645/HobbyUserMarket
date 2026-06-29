import { createClient } from "@/lib/supabase/server";
import { getListingImages } from "@/lib/posts/listing-images";
import type { ListingImagePreview, PostRow } from "@/types/post";

export type ListingForEdit = PostRow & {
  location: unknown;
  images: ListingImagePreview[];
};

export async function getListingForEdit(
  slug: string,
  userId: string,
): Promise<ListingForEdit | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*, location")
    .eq("slug", slug)
    .eq("user_id", userId)
    .in("status", ["active", "hidden"])
    .maybeSingle<PostRow & { location: unknown }>();

  if (error || !data) return null;

  const rows = await getListingImages(supabase, data.id);
  const images: ListingImagePreview[] = rows.map((row) => ({
    id: row.id,
    url: row.url,
    isMain: row.is_main,
    sortOrder: row.sort_order,
  }));

  return { ...data, images };
}
