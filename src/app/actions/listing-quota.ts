"use server";

import { getCurrentUser } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function adminGrantListingPackage(
  formData: FormData,
): Promise<void> {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "admin") {
    redirect("/");
  }

  const userId = String(formData.get("userId") ?? "").trim();
  const packageSlug = String(formData.get("packageSlug") ?? "promo_partner").trim();
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!userId) {
    redirect("/mod/uzivatele?error=missing_user");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_grant_listing_package", {
    p_user_id: userId,
    p_package_slug: packageSlug,
    p_note: note,
  });

  if (error) {
    console.error("admin_grant_listing_package:", error);
    redirect(
      `/mod/uzivatele?error=${encodeURIComponent("Balíček se nepodařilo přidělit.")}`,
    );
  }

  revalidatePath("/mod/uzivatele");
  revalidatePath("/profil/nastaveni");
  revalidatePath("/moje-inzeraty");
  redirect("/mod/uzivatele?granted=1");
}
