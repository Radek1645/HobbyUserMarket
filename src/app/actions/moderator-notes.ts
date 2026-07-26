"use server";

import {
  MODERATOR_NOTE_ENTITY,
  MODERATOR_NOTE_KIND,
  MODERATOR_NOTE_KINDS,
  MODERATOR_NOTE_MAX_LENGTH,
  type ModeratorNoteKindCode,
} from "@/config/moderator-notes";
import { getCurrentUser } from "@/lib/auth/get-user";
import { isStaffRole } from "@/lib/auth/is-staff-role";
import { getListingPath } from "@/lib/posts/listing-path";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function requireStaff() {
  return getCurrentUser().then((user) => {
    if (!user || !isStaffRole(user.role)) {
      redirect("/");
    }
    return user;
  });
}

function parseReturnPath(formData: FormData, fallback: string): string {
  const raw = String(formData.get("returnPath") ?? "").trim();
  if (raw.startsWith("/inzerat/") || raw.startsWith("/mod/")) {
    return raw.split("?")[0] ?? fallback;
  }
  return fallback;
}

function parseKindCode(raw: string): ModeratorNoteKindCode | null {
  const code = raw.trim();
  if (MODERATOR_NOTE_KINDS.some((item) => item.code === code)) {
    return code as ModeratorNoteKindCode;
  }
  return null;
}

function parseBody(formData: FormData): string | null {
  const body = String(formData.get("body") ?? "").trim();
  if (!body || body.length > MODERATOR_NOTE_MAX_LENGTH) return null;
  return body;
}

/** Přidá poznámku k inzerátu (default kind: zadano_uzivatelem). */
export async function createPostModeratorNote(
  formData: FormData,
): Promise<void> {
  const user = await requireStaff();
  const postId = Number.parseInt(String(formData.get("postId") ?? ""), 10);
  const slug = String(formData.get("postSlug") ?? "").trim();
  const fallback = slug ? getListingPath(slug) : "/mod/inzeraty";
  const returnPath = parseReturnPath(formData, fallback);

  if (!Number.isInteger(postId) || postId < 1) {
    redirect(`${returnPath}?noteError=invalid_post`);
  }

  const body = parseBody(formData);
  if (!body) {
    redirect(`${returnPath}?noteError=invalid_body`);
  }

  const kindCode =
    parseKindCode(String(formData.get("kindCode") ?? "")) ??
    MODERATOR_NOTE_KIND.zadanoUzivatelem;

  const supabase = await createClient();
  const { error } = await supabase.from("moderator_notes").insert({
    entity_type: MODERATOR_NOTE_ENTITY.post,
    entity_id: String(postId),
    kind_code: kindCode,
    body,
    author_user_id: user.id,
  });

  if (error) {
    console.error("createPostModeratorNote:", error);
    redirect(`${returnPath}?noteError=save_failed`);
  }

  revalidatePath(returnPath);
  redirect(`${returnPath}?noteOk=1`);
}

/** Upraví vlastní poznámku do 24 h od vytvoření. */
export async function updateModeratorNote(formData: FormData): Promise<void> {
  const user = await requireStaff();
  const noteNo = Number.parseInt(String(formData.get("noteNo") ?? ""), 10);
  const slug = String(formData.get("postSlug") ?? "").trim();
  const fallback = slug ? getListingPath(slug) : "/mod/inzeraty";
  const returnPath = parseReturnPath(formData, fallback);

  if (!Number.isInteger(noteNo) || noteNo < 1) {
    redirect(`${returnPath}?noteError=invalid_note`);
  }

  const body = parseBody(formData);
  if (!body) {
    redirect(`${returnPath}?noteError=invalid_body`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("moderator_notes")
    .update({ body })
    .eq("note_no", noteNo)
    .eq("author_user_id", user.id)
    .select("note_no")
    .maybeSingle();

  if (error || !data) {
    console.error("updateModeratorNote:", error);
    redirect(`${returnPath}?noteError=update_failed`);
  }

  revalidatePath(returnPath);
  redirect(`${returnPath}?noteOk=updated`);
}
