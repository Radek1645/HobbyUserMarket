"use server";

import {
  REPORT_DETAIL_MAX_LENGTH,
  REPORT_REASON_CODES,
  type ReportReasonCode,
} from "@/config/reports";
import {
  POST_STATUS_REASON,
} from "@/config/listing-status-reasons";
import { COMMENT_STATUS, POST_STATUS } from "@/config/post-status";
import { getCurrentUser } from "@/lib/auth/get-user";
import { isStaffRole } from "@/lib/auth/is-staff-role";
import { notifyAdminReport } from "@/lib/email/notify-admin-report";
import { notifyListingRestricted } from "@/lib/email/notify-listing-restricted";
import { parseListingReportUrl } from "@/lib/reports/parse-listing-url";
import { getListingPath } from "@/lib/posts/listing-path";
import { createAdminClient } from "@/lib/supabase/admin";
import { isUniqueViolation } from "@/lib/supabase/postgres-errors";
import { createClient } from "@/lib/supabase/server";
import type { AppUser } from "@/types/auth";
import type { PostStatusReasonCode } from "@/types/post";
import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const REASON_NOTE_MAX = 500;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ModeratorPostRow = {
  id: number;
  status: string;
  slug: string;
};

type ModeratorListingAction = "block" | "delete" | "restore";

async function requireModerator(): Promise<AppUser> {
  const user = await getCurrentUser();
  if (!user || !isStaffRole(user.role)) {
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

function parseReturnPath(formData: FormData, fallback: string): string {
  const raw = String(formData.get("returnPath") ?? "").trim();
  if (raw.startsWith("/mod/") || raw.startsWith("/inzerat/")) {
    return raw.split("?")[0] ?? fallback;
  }
  return fallback;
}

function parseReportReason(raw: string): ReportReasonCode | null {
  const reason = raw.trim();
  if (REPORT_REASON_CODES.has(reason as ReportReasonCode)) {
    return reason as ReportReasonCode;
  }
  return null;
}

function validatePostForModeratorAction(
  post: ModeratorPostRow,
  action: ModeratorListingAction,
): string | null {
  switch (action) {
    case "block":
      if (
        post.status === POST_STATUS.deleted ||
        post.status === POST_STATUS.blocked
      ) {
        return "post_already_restricted";
      }
      return null;
    case "delete":
      if (post.status === POST_STATUS.deleted) {
        return "post_already_deleted";
      }
      return null;
    case "restore":
      if (post.status !== POST_STATUS.blocked) {
        return "post_not_blocked";
      }
      return null;
  }
}

function getPostUpdateForModeratorAction(action: ModeratorListingAction) {
  switch (action) {
    case "block":
      return {
        status: POST_STATUS.blocked,
        status_reason_code: POST_STATUS_REASON.moderation,
      };
    case "delete":
      return {
        status: POST_STATUS.deleted,
        status_reason_code: POST_STATUS_REASON.moderation,
      };
    case "restore":
      return {
        status: POST_STATUS.active,
        status_reason_code: null,
      };
  }
}

function getSuccessQueryParam(action: ModeratorListingAction): string {
  switch (action) {
    case "block":
      return "listing_blocked=1";
    case "delete":
      return "listing_deleted=1";
    case "restore":
      return "listing_restored=1";
  }
}

function revalidateModeratedListing(slug: string): void {
  revalidatePath("/moje-inzeraty");
  revalidatePath(getListingPath(slug));
  revalidatePath("/mod/karantena");
  revalidatePath("/mod/inzeraty");
}

async function loadPostForModerator(
  adminClient: SupabaseClient,
  postId: number,
): Promise<ModeratorPostRow | null> {
  const { data: post, error } = await adminClient
    .from("posts")
    .select("id, status, slug")
    .eq("id", postId)
    .maybeSingle<ModeratorPostRow>();

  if (error || !post) return null;
  return post;
}

/** Společný tok pro zablokování, smazání nebo obnovení inzerátu moderátorem. */
async function runModeratorListingAction(
  formData: FormData,
  action: ModeratorListingAction,
  defaultReturnPath: string,
): Promise<void> {
  await requireModerator();

  const postId = parsePostId(formData);
  const returnPath = parseReturnPath(formData, defaultReturnPath);
  if (!postId) {
    redirect(`${returnPath}?error=invalid_post`);
  }

  const reasonNote =
    action === "restore" ? undefined : parseReasonNote(formData);

  // Session moderátora — posts_update_moderator + publish gate bypass přes is_moderator_or_admin().
  // service_role má na posts jen SELECT (008) → UPDATE přes admin klient selže.
  const supabase = await createClient();

  const post = await loadPostForModerator(supabase, postId);
  if (!post) {
    redirect(`${returnPath}?error=post_not_found`);
  }

  const validationError = validatePostForModeratorAction(post, action);
  if (validationError) {
    redirect(`${returnPath}?error=${validationError}`);
  }

  const { error: updateError } = await supabase
    .from("posts")
    .update({
      ...getPostUpdateForModeratorAction(action),
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId);

  if (updateError) {
    console.error(`runModeratorListingAction(${action}):`, updateError);
    redirect(`${returnPath}?error=${action}_failed`);
  }

  if (action === "block") {
    await notifyListingRestricted({
      postId,
      action: "blocked",
      reasonCode: POST_STATUS_REASON.moderation,
      reasonDetail: reasonNote,
    });
  } else if (action === "delete") {
    await notifyListingRestricted({
      postId,
      action: "deleted",
      reasonCode: POST_STATUS_REASON.moderation,
      reasonDetail: reasonNote,
    });
  }

  revalidateModeratedListing(post.slug);
  redirect(`${returnPath}?${getSuccessQueryParam(action)}`);
}

async function countDistinctReporters(postId: number): Promise<number> {
  const adminResult = createAdminClient();
  if (!adminResult.ok) return 0;

  const { data } = await adminResult.client
    .from("reports")
    .select("reporter_user_id")
    .eq("target_type", "post")
    .eq("target_post_id", postId)
    .not("reporter_user_id", "is", null);

  return new Set(data?.map((row) => row.reporter_user_id)).size;
}

/** Po vložení nahlášení: e-mail adminovi a případná notifikace auto-bloku. */
async function afterReportInserted(params: {
  postId: number;
  postTitle: string;
  postSlug: string;
  reason: ReportReasonCode;
  source: "inline" | "standalone";
  detailText?: string;
  reporterEmail?: string;
}): Promise<{ autoBlocked: boolean }> {
  const adminResult = createAdminClient();
  if (!adminResult.ok) {
    console.error("afterReportInserted admin:", adminResult.error);
    return { autoBlocked: false };
  }

  const reportCount = await countDistinctReporters(params.postId);

  await notifyAdminReport({
    postTitle: params.postTitle,
    postSlug: params.postSlug,
    reason: params.reason,
    source: params.source,
    reportCount,
    detailText: params.detailText,
    reporterEmail: params.reporterEmail,
  });

  const { data: updatedPost } = await adminResult.client
    .from("posts")
    .select("status, status_reason_code")
    .eq("id", params.postId)
    .maybeSingle<{
      status: string;
      status_reason_code: PostStatusReasonCode | null;
    }>();

  if (
    updatedPost?.status === POST_STATUS.blocked &&
    updatedPost.status_reason_code === POST_STATUS_REASON.reports_threshold
  ) {
    await notifyListingRestricted({
      postId: params.postId,
      action: "blocked",
      reasonCode: POST_STATUS_REASON.reports_threshold,
    });
    return { autoBlocked: true };
  }

  return { autoBlocked: false };
}

export async function adminBlockListing(formData: FormData): Promise<void> {
  await runModeratorListingAction(formData, "block", "/mod/karantena");
}

export async function adminDeleteListing(formData: FormData): Promise<void> {
  await runModeratorListingAction(formData, "delete", "/mod/karantena");
}

export async function adminRestoreListing(formData: FormData): Promise<void> {
  await runModeratorListingAction(formData, "restore", "/mod/karantena");
}

export async function adminRestoreComment(formData: FormData): Promise<void> {
  await requireModerator();

  const commentId = String(formData.get("commentId") ?? "").trim();
  if (!commentId) {
    redirect("/mod/karantena?error=invalid_comment");
  }

  const supabase = await createClient();

  const { error: updateError } = await supabase
    .from("comments")
    .update({ status: COMMENT_STATUS.active })
    .eq("id", commentId)
    .eq("status", COMMENT_STATUS.hidden);

  if (updateError) {
    console.error("adminRestoreComment:", updateError);
    redirect("/mod/karantena?error=restore_failed");
  }

  revalidatePath("/mod/karantena");
  redirect("/mod/karantena?comment_restored=1");
}

/** Inline nahlášení z detailu inzerátu (vyžaduje přihlášení). */
export async function submitListingReport(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const postId = parsePostId(formData);
  const postSlug = String(formData.get("postSlug") ?? "").trim();
  const reason = parseReportReason(String(formData.get("reason") ?? ""));

  if (!postId || !postSlug) {
    redirect("/?error=invalid_report");
  }

  if (!reason) {
    redirect(`${getListingPath(postSlug)}?error=invalid_report_reason`);
  }

  const supabase = await createClient();

  const { data: post } = await supabase
    .from("posts")
    .select("id, user_id, status, title, slug")
    .eq("id", postId)
    .maybeSingle<{
      id: number;
      user_id: string;
      status: string;
      title: string;
      slug: string;
    }>();

  if (!post || post.status !== POST_STATUS.active) {
    redirect(`${getListingPath(postSlug)}?error=report_target_unavailable`);
  }

  if (post.user_id === user.id) {
    redirect(`${getListingPath(postSlug)}?error=cannot_report_own_listing`);
  }

  const detailText = String(formData.get("detailText") ?? "")
    .trim()
    .slice(0, REPORT_DETAIL_MAX_LENGTH);

  const { error: insertError } = await supabase.from("reports").insert({
    target_type: "post",
    target_post_id: postId,
    reporter_user_id: user.id,
    reason,
    source: "inline",
    detail_text: detailText || null,
  });

  if (insertError) {
    if (isUniqueViolation(insertError)) {
      redirect(`${getListingPath(postSlug)}?error=already_reported`);
    }
    console.error("submitListingReport:", insertError);
    redirect(`${getListingPath(postSlug)}?error=report_failed`);
  }

  await afterReportInserted({
    postId,
    postTitle: post.title,
    postSlug: post.slug,
    reason,
    source: "inline",
    detailText: detailText || undefined,
  });

  revalidatePath(getListingPath(postSlug));
  revalidatePath("/mod/karantena");
  redirect(`${getListingPath(postSlug)}?reported=1`);
}

/** Standalone formulář /nahlasit — i pro nepřihlášené. */
export async function submitStandaloneReport(formData: FormData): Promise<void> {
  const listingUrl = String(formData.get("listingUrl") ?? "");
  const parsedUrl = parseListingReportUrl(listingUrl);

  if (!parsedUrl.ok) {
    redirect(`/nahlasit?error=${encodeURIComponent(parsedUrl.error)}`);
  }

  const reason = parseReportReason(String(formData.get("reason") ?? ""));
  if (!reason) {
    redirect("/nahlasit?error=invalid_report_reason");
  }

  const detailText = String(formData.get("detailText") ?? "")
    .trim()
    .slice(0, REPORT_DETAIL_MAX_LENGTH);

  const user = await getCurrentUser();
  const reporterEmailRaw = String(formData.get("reporterEmail") ?? "").trim();

  if (!user && !reporterEmailRaw) {
    redirect("/nahlasit?error=missing_email");
  }

  if (reporterEmailRaw && !EMAIL_PATTERN.test(reporterEmailRaw)) {
    redirect("/nahlasit?error=invalid_email");
  }

  const supabase = await createClient();
  const { data: post } = await supabase
    .from("posts")
    .select("id, user_id, status, title, slug")
    .eq("slug", parsedUrl.slug)
    .maybeSingle<{
      id: number;
      user_id: string;
      status: string;
      title: string;
      slug: string;
    }>();

  if (!post || post.status !== POST_STATUS.active) {
    redirect("/nahlasit?error=report_target_unavailable");
  }

  if (user && post.user_id === user.id) {
    redirect("/nahlasit?error=cannot_report_own_listing");
  }

  const insertPayload = {
    target_type: "post" as const,
    target_post_id: post.id,
    reporter_user_id: user?.id ?? null,
    reporter_email: user ? reporterEmailRaw || user.email : reporterEmailRaw,
    reason,
    source: "standalone" as const,
    detail_text: detailText || null,
  };

  let insertError: { code?: string; message?: string } | null = null;

  if (user) {
    const result = await supabase.from("reports").insert(insertPayload);
    insertError = result.error;
  } else {
    const adminResult = createAdminClient();
    if (!adminResult.ok) {
      redirect("/nahlasit?error=service_unavailable");
    }
    const result = await adminResult.client.from("reports").insert(insertPayload);
    insertError = result.error;
  }

  if (insertError) {
    if (isUniqueViolation(insertError)) {
      redirect("/nahlasit?error=already_reported");
    }
    console.error("submitStandaloneReport:", insertError);
    redirect("/nahlasit?error=report_failed");
  }

  await afterReportInserted({
    postId: post.id,
    postTitle: post.title,
    postSlug: post.slug,
    reason,
    source: "standalone",
    detailText: detailText || undefined,
    reporterEmail: insertPayload.reporter_email ?? undefined,
  });

  revalidatePath(getListingPath(post.slug));
  revalidatePath("/mod/karantena");
  redirect("/nahlasit?submitted=1");
}
