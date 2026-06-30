"use server";

import { getCurrentUser } from "@/lib/auth/get-user";
import { postAllowsDirectContact } from "@/lib/posts/contact-display";
import { createClient } from "@/lib/supabase/server";

export type RevealContactState = {
  email?: string | null;
  phone?: string | null;
  error?: string;
};

export async function revealListingContact(
  postId: number,
): Promise<RevealContactState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Pro zobrazení kontaktu se přihlas." };
  }

  const supabase = await createClient();

  const { data: post, error: postError } = await supabase
    .from("posts")
    .select(
      "user_id, show_contact_email, show_contact_phone, contact_phone, status, expires_at",
    )
    .eq("id", postId)
    .maybeSingle();

  if (postError || !post) {
    return { error: "Inzerát nebyl nalezen." };
  }

  if (!postAllowsDirectContact(post)) {
    return { error: "Zadavatel nepovolil přímé zobrazení kontaktu." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", post.user_id)
    .maybeSingle();

  if (profileError || !profile) {
    return { error: "Kontakt se nepodařilo načíst." };
  }

  const email =
    post.show_contact_email === true && profile.email?.trim()
      ? profile.email.trim()
      : null;
  const phone =
    post.show_contact_phone === true && post.contact_phone?.trim()
      ? post.contact_phone.trim()
      : null;

  if (!email && !phone) {
    return { error: "Zadavatel nemá u inzerátu vyplněný kontakt." };
  }

  await supabase.from("contact_reveals").insert({
    post_id: postId,
    viewer_user_id: user.id,
  });

  return { email, phone };
}
