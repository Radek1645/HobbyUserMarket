"use server";

import { getCurrentUser } from "@/lib/auth/get-user";
import { buildPostSlug } from "@/lib/posts/slug";
import { validateCreateListing } from "@/lib/posts/validation";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type CreateListingState = {
  error?: string;
};

export async function createListing(
  _prev: CreateListingState,
  formData: FormData,
): Promise<CreateListingState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Pro založení inzerátu se musíš přihlásit." };
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
    title: data.title,
    description: data.description,
    category_type: data.categoryType,
    subcategory_slug: data.subcategorySlug,
    price_type: data.priceType,
    price_amount: data.priceAmount,
    condition_label: data.conditionLabel,
    location_text: data.locationText,
    location: `SRID=4326;POINT(${data.longitude} ${data.latitude})`,
    status: "active",
    slug,
    listing_duration_days: data.listingDurationDays,
  };

  if (data.categoryType === "udalost" && data.eventDate) {
    insertPayload.event_date = data.eventDate;
  }

  const { data: row, error } = await supabase
    .from("posts")
    .insert(insertPayload)
    .select("id, slug")
    .single();

  if (error) {
    console.error("createListing:", error);
    return { error: "Inzerát se nepodařilo uložit. Zkus to znovu." };
  }

  revalidatePath("/");
  redirect(`/inzerat/${row.id}-${row.slug}`);
}
