import { createClient } from "@/lib/supabase/server";
import type { PostRow } from "@/types/post";

export type ListingForEdit = PostRow & {
  location: unknown;
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
    .maybeSingle<ListingForEdit>();

  if (error || !data) return null;
  return data;
}
