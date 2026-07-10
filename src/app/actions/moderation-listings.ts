"use server";

import { getCurrentUser } from "@/lib/auth/get-user";
import { notifyListingRestricted } from "@/lib/email/notify-listing-restricted";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const REASON_NOTE_MAX = 500;

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    redirect("/");
  }
  return user;
}

function parsePostId(formData: FormData): number | null {
  const raw = String(formData.get("postId") ?? "").trim();
  const postId = Number(raw);
  if (!Number.isInteger(postId) || postId < 1) {
    return null;
  }
  return postId;
}

function parseReasonNote(formData: FormData): string | undefined {
  const note = String(formData.get("reasonNote") ?? "").trim();
  if (!note) return undefined;
  return note.slice(0, REASON_NOTE_MAX);
}

export async function adminBlockListing(formData: FormData): Promise<void> {
  await requireAdmin();

  const postId = parsePostId(formData);
  if (!postId) {
    redirect("/mod/uzivatele?error=invalid_post");
  }

  const reasonNote = parseReasonNote(formData);

  const adminResult = createAdminClient();
  if (!adminResult.ok) {
    redirect(
      `/mod/uzivatele?error=${encodeURIComponent(adminResult.error)}`,
    );
  }

  const { data: post, error: fetchError } = await adminResult.client
    .from("posts")
    .select("id, status")
    .eq("id", postId)
    .maybeSingle<{ id: number; status: string }>();

  if (fetchError || !post) {
    redirect("/mod/uzivatele?error=post_not_found");
  }

  if (post.status === "deleted" || post.status === "blocked") {
    redirect("/mod/uzivatele?error=post_already_restricted");
  }

  const { error: updateError } = await adminResult.client
    .from("posts")
    .update({
      status: "blocked",
      status_reason_code: "moderation",
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId);

  if (updateError) {
    console.error("adminBlockListing:", updateError);
    redirect("/mod/uzivatele?error=block_failed");
  }

  await notifyListingRestricted({
    postId,
    action: "blocked",
    reasonCode: "moderation",
    reasonDetail: reasonNote,
  });

  revalidatePath("/moje-inzeraty");
  redirect("/mod/uzivatele?listing_blocked=1");
}

export async function adminDeleteListing(formData: FormData): Promise<void> {
  await requireAdmin();

  const postId = parsePostId(formData);
  if (!postId) {
    redirect("/mod/uzivatele?error=invalid_post");
  }

  const reasonNote = parseReasonNote(formData);

  const adminResult = createAdminClient();
  if (!adminResult.ok) {
    redirect(
      `/mod/uzivatele?error=${encodeURIComponent(adminResult.error)}`,
    );
  }

  const { data: post, error: fetchError } = await adminResult.client
    .from("posts")
    .select("id, status")
    .eq("id", postId)
    .maybeSingle<{ id: number; status: string }>();

  if (fetchError || !post) {
    redirect("/mod/uzivatele?error=post_not_found");
  }

  if (post.status === "deleted") {
    redirect("/mod/uzivatele?error=post_already_deleted");
  }

  const { error: updateError } = await adminResult.client
    .from("posts")
    .update({
      status: "deleted",
      status_reason_code: "moderation",
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId);

  if (updateError) {
    console.error("adminDeleteListing:", updateError);
    redirect("/mod/uzivatele?error=delete_failed");
  }

  await notifyListingRestricted({
    postId,
    action: "deleted",
    reasonCode: "moderation",
    reasonDetail: reasonNote,
  });

  revalidatePath("/moje-inzeraty");
  redirect("/mod/uzivatele?listing_deleted=1");
}

/** Po vložení hlášení zkontroluje auto-block a pošle Statement of Reasons. */
export async function submitListingReport(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const postId = parsePostId(formData);
  const reason = String(formData.get("reason") ?? "").trim();

  if (!postId) {
    redirect("/?error=invalid_report");
  }

  if (!["fraud", "illegal", "inappropriate"].includes(reason)) {
    redirect("/?error=invalid_report_reason");
  }

  const supabase = await createClient();

  const { data: post } = await supabase
    .from("posts")
    .select("id, user_id, status")
    .eq("id", postId)
    .maybeSingle<{ id: number; user_id: string; status: string }>();

  if (!post || post.status !== "active") {
    redirect("/?error=report_target_unavailable");
  }

  if (post.user_id === user.id) {
    redirect("/?error=cannot_report_own_listing");
  }

  const { error: insertError } = await supabase.from("reports").insert({
    target_type: "post",
    target_post_id: postId,
    reporter_user_id: user.id,
    reason,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      redirect("/?error=already_reported");
    }
    console.error("submitListingReport:", insertError);
    redirect("/?error=report_failed");
  }

  const { data: updatedPost } = await supabase
    .from("posts")
    .select("status, status_reason_code")
    .eq("id", postId)
    .maybeSingle<{ status: string; status_reason_code: string | null }>();

  if (
    updatedPost?.status === "blocked" &&
    updatedPost.status_reason_code === "reports_threshold"
  ) {
    await notifyListingRestricted({
      postId,
      action: "blocked",
      reasonCode: "reports_threshold",
    });
  }

  redirect("/?reported=1");
}
