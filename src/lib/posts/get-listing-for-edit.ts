import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getListingImages } from "@/lib/posts/listing-images";
import type { ListingImagePreview, PostRow } from "@/types/post";

export type ListingForEdit = PostRow & {
  location: unknown;
  images: ListingImagePreview[];
};

export type GetListingForEditOptions = {
  /** God Mode — moderátor/admin smí načíst cizí inzerát. */
  asStaff?: boolean;
};

type EditPrivateFields = {
  original_title: string | null;
  original_description: string | null;
  latitude: number;
  longitude: number;
};

// contact_phone / location / original_* nejsou v SELECT grantu — RPC.
const EDIT_COLUMNS =
  "id, user_id, title, description, " +
  "category_type, subcategory_slug, price_type, price_amount, exchange_for, " +
  "condition_label, location_text, status, status_reason_code, expires_at, listing_duration_days, " +
  "event_date, renew_count, payment_status, listing_quota_consumed, main_image_url, slug, " +
  "show_contact_email, show_contact_phone, created_at, updated_at, job_cv_required, " +
  "external_url";

function geoJsonPoint(longitude: number, latitude: number): unknown {
  return { type: "Point", coordinates: [longitude, latitude] };
}

function readEditPrivateFields(data: unknown): EditPrivateFields | null {
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== "object") return null;
  const record = row as Partial<EditPrivateFields>;
  if (
    typeof record.latitude !== "number" ||
    typeof record.longitude !== "number"
  ) {
    return null;
  }
  return {
    original_title:
      typeof record.original_title === "string" ? record.original_title : null,
    original_description:
      typeof record.original_description === "string"
        ? record.original_description
        : null,
    latitude: record.latitude,
    longitude: record.longitude,
  };
}

async function loadContactPhoneForEdit(
  postId: number,
  asStaff: boolean,
): Promise<string | null> {
  if (asStaff) {
    const adminResult = createAdminClient();
    if (!adminResult.ok) return null;
    const { data } = await adminResult.client
      .from("posts")
      .select("contact_phone")
      .eq("id", postId)
      .maybeSingle<{ contact_phone: string | null }>();
    return typeof data?.contact_phone === "string" ? data.contact_phone : null;
  }

  const supabase = await createClient();
  const { data: phone } = await supabase.rpc("get_owned_post_contact_phone", {
    p_post_id: postId,
  });
  return typeof phone === "string" ? phone : null;
}

async function loadEditPrivateFields(
  postId: number,
): Promise<EditPrivateFields | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_post_edit_private_fields", {
    p_post_id: postId,
  });
  if (error) {
    console.error("get_post_edit_private_fields:", error);
    return null;
  }
  return readEditPrivateFields(data);
}

export async function getListingForEdit(
  slug: string,
  userId: string,
  options?: GetListingForEditOptions,
): Promise<ListingForEdit | null> {
  const asStaff = options?.asStaff === true;
  const supabase = await createClient();

  let query = supabase
    .from("posts")
    .select(EDIT_COLUMNS)
    .eq("slug", slug)
    // 'draft' = neúspěšně publikovaný inzerát (H1) — vlastník ho musí umět
    // doupravit a znovu odeslat.
    .in("status", ["active", "hidden", "draft", "blocked"]);

  if (!asStaff) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query.maybeSingle<PostRow>();

  if (error || !data) return null;

  const [phone, privateFields] = await Promise.all([
    loadContactPhoneForEdit(data.id, asStaff),
    loadEditPrivateFields(data.id),
  ]);

  const rows = await getListingImages(supabase, data.id);
  const images: ListingImagePreview[] = rows.map((row) => ({
    id: row.id,
    url: row.url,
    storagePath: row.storage_path,
    isMain: row.is_main,
    sortOrder: row.sort_order,
  }));

  return {
    ...data,
    original_title: privateFields?.original_title ?? null,
    original_description: privateFields?.original_description ?? null,
    location: privateFields
      ? geoJsonPoint(privateFields.longitude, privateFields.latitude)
      : null,
    contact_phone: phone,
    images,
  };
}
