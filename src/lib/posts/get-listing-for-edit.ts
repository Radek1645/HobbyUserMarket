import { createClient } from "@/lib/supabase/server";
import { getListingImages } from "@/lib/posts/listing-images";
import type { ListingImagePreview, PostRow } from "@/types/post";

export type ListingForEdit = PostRow & {
  location: unknown;
  images: ListingImagePreview[];
};

// contact_phone je odebraný z veřejného SELECT (C2) — vlastníkovi ho pro
// předvyplnění vrací dedikované RPC get_owned_post_contact_phone.
const EDIT_COLUMNS =
  "id, user_id, title, description, original_title, original_description, " +
  "category_type, subcategory_slug, price_type, price_amount, exchange_for, " +
  "condition_label, location_text, status, status_reason_code, expires_at, listing_duration_days, " +
  "event_date, renew_count, payment_status, listing_quota_consumed, main_image_url, slug, " +
  "show_contact_email, show_contact_phone, created_at, updated_at, location, job_cv_required";

export async function getListingForEdit(
  slug: string,
  userId: string,
): Promise<ListingForEdit | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select(EDIT_COLUMNS)
    .eq("slug", slug)
    .eq("user_id", userId)
    // 'draft' = neúspěšně publikovaný inzerát (H1) — vlastník ho musí umět
    // doupravit a znovu odeslat.
    .in("status", ["active", "hidden", "draft", "blocked"])
    .maybeSingle<PostRow & { location: unknown }>();

  if (error || !data) return null;

  const { data: phone } = await supabase.rpc("get_owned_post_contact_phone", {
    p_post_id: data.id,
  });

  const rows = await getListingImages(supabase, data.id);
  const images: ListingImagePreview[] = rows.map((row) => ({
    id: row.id,
    url: row.url,
    isMain: row.is_main,
    sortOrder: row.sort_order,
  }));

  return {
    ...data,
    contact_phone: typeof phone === "string" ? phone : null,
    images,
  };
}
