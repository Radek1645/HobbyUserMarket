"use server";

import { getCurrentUser } from "@/lib/auth/get-user";
import { getListingPath } from "@/lib/posts/listing-path";
import { buildPostSlug } from "@/lib/posts/slug";
import {
  validateCreateListing,
  validateUpdateListing,
  type CreateListingInput,
} from "@/lib/posts/validation";
import { stripContactInfo } from "@/lib/moderation/strip-contacts";
import { syncListingImagesFromForm } from "@/lib/posts/listing-images";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type CreateListingState = {
  error?: string;
};

export type UpdateListingState = {
  error?: string;
};

function buildListingPayload(data: CreateListingInput) {
  const payload: Record<string, unknown> = {
    title: stripContactInfo(data.title),
    description: stripContactInfo(data.description),
    category_type: data.categoryType,
    subcategory_slug: data.subcategorySlug,
    price_type: data.priceType,
    price_amount: data.priceAmount,
    exchange_for:
      data.priceType === "exchange" && data.exchangeFor
        ? stripContactInfo(data.exchangeFor)
        : null,
    condition_label: data.conditionLabel,
    location_text: data.locationText,
    location: `SRID=4326;POINT(${data.longitude} ${data.latitude})`,
    listing_duration_days: data.listingDurationDays,
    show_contact_email: data.showContactEmail,
    show_contact_phone: data.showContactPhone,
    contact_phone:
      data.showContactPhone && data.contactPhone ? data.contactPhone : null,
  };

  if (data.categoryType === "udalost" && data.eventDate) {
    payload.event_date = data.eventDate;
  } else {
    payload.event_date = null;
  }

  if (
    data.originalTitle !== undefined &&
    data.originalDescription !== undefined
  ) {
    payload.original_title = stripContactInfo(data.originalTitle);
    payload.original_description = stripContactInfo(data.originalDescription);
  }

  return payload;
}

export async function createListing(
  _prev: CreateListingState,
  formData: FormData,
): Promise<CreateListingState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Pro založení inzerátu se musíte přihlásit." };
  }

  const validated = validateCreateListing(formData);
  if (!validated.ok) {
    return { error: validated.error };
  }

  const data = validated.data;
  const supabase = await createClient();
  const slug = buildPostSlug(data.title);

  const insertPayload: Record<string, unknown> = {
    user_id: user.id,
    ...buildListingPayload(data),
    status: "active",
    slug,
  };

  const { data: row, error } = await supabase
    .from("posts")
    .insert(insertPayload)
    .select("id, slug")
    .single();

  if (error || !row) {
    console.error("createListing:", error);
    return { error: "Inzerát se nepodařilo uložit. Zkuste to prosím znovu." };
  }

  const imageResult = await syncListingImagesFromForm(
    supabase,
    user.id,
    row.id,
    formData,
  );

  if (imageResult.error) {
    return { error: imageResult.error };
  }

  revalidatePath("/");
  redirect(getListingPath(row.slug));
}

export async function updateListing(
  _prev: UpdateListingState,
  formData: FormData,
): Promise<UpdateListingState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Pro úpravu inzerátu se musíte přihlásit." };
  }

  const postId = Number.parseInt(String(formData.get("postId") ?? ""), 10);
  if (Number.isNaN(postId) || postId < 1) {
    return { error: "Neplatný inzerát." };
  }

  const supabase = await createClient();
  const { data: existing, error: fetchError } = await supabase
    .from("posts")
    .select("id, slug, user_id, event_date, status")
    .eq("id", postId)
    .maybeSingle<{
      id: number;
      slug: string;
      user_id: string;
      event_date: string | null;
      status: string;
    }>();

  if (fetchError || !existing) {
    return { error: "Inzerát nebyl nalezen." };
  }

  if (existing.user_id !== user.id) {
    return { error: "Tento inzerát může upravit jen jeho autor." };
  }

  if (existing.status !== "active" && existing.status !== "hidden") {
    return { error: "Tento inzerát už nelze upravovat." };
  }

  const validated = validateUpdateListing(formData, existing.event_date);
  if (!validated.ok) {
    return { error: validated.error };
  }

  const { error: updateError } = await supabase
    .from("posts")
    .update(buildListingPayload(validated.data))
    .eq("id", postId)
    .eq("user_id", user.id);

  if (updateError) {
    console.error("updateListing:", updateError);
    return { error: "Změny se nepodařilo uložit. Zkuste to prosím znovu." };
  }

  const imageResult = await syncListingImagesFromForm(
    supabase,
    user.id,
    postId,
    formData,
  );

  if (imageResult.error) {
    return { error: imageResult.error };
  }

  revalidatePath("/");
  revalidatePath(getListingPath(existing.slug));
  revalidatePath(`${getListingPath(existing.slug)}/upravit`);
  redirect(getListingPath(existing.slug));
}
