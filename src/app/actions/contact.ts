"use server";

import { CONTACT_REVEAL_RATE_LIMIT_PER_DAY } from "@/config/app";
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
    return { error: "Pro zobrazení kontaktu se přihlaste." };
  }

  const supabase = await createClient();

  // Pre-check jen pro přesné (ne-PII) chybové hlášky. Telefon ani cizí profil
  // se zde nečtou — PII vrací výhradně reveal_listing_contact RPC.
  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("show_contact_email, show_contact_phone, status, expires_at")
    .eq("id", postId)
    .maybeSingle();

  if (postError || !post) {
    return { error: "Inzerát nebyl nalezen." };
  }

  if (!postAllowsDirectContact(post)) {
    return { error: "Zadavatel nepovolil přímé zobrazení kontaktu." };
  }

  const { data, error } = await supabase.rpc("reveal_listing_contact", {
    p_post_id: postId,
  });

  if (error) {
    if (error.message?.includes("contact_reveal_rate_limited")) {
      return {
        error: `Denní limit zobrazených kontaktů (${CONTACT_REVEAL_RATE_LIMIT_PER_DAY}) je vyčerpaný. Zkuste to prosím zítra, nebo zadavateli napište přes formulář.`,
      };
    }
    return { error: "Kontakt se nepodařilo načíst." };
  }

  const row = Array.isArray(data) ? data[0] : data;
  const email = row?.email ?? null;
  const phone = row?.phone ?? null;

  if (!email && !phone) {
    return { error: "Zadavatel nemá u inzerátu vyplněný kontakt." };
  }

  return { email, phone };
}
