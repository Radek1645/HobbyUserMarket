import {
  buildListingRestrictedEmail,
  type ListingRestrictionAction,
} from "@/lib/email/templates/listing-restricted";
import { sendTransactionalEmail } from "@/lib/email/send";
import { resolveOwnerEmail } from "@/lib/inquiry/resolve-owner-email";
import { DSA_CONTACT_PATH, VOP_PATH } from "@/config/legal";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteUrl } from "@/lib/supabase/env";
import type { PostStatusReasonCode } from "@/types/post";

export type NotifyListingRestrictedParams = {
  postId: number;
  action: ListingRestrictionAction;
  reasonCode: PostStatusReasonCode;
  reasonDetail?: string;
};

/** Statement of Reasons (VOP §4.6) — nevyhazuje výjimku při chybě odeslání. */
export async function notifyListingRestricted(
  params: NotifyListingRestrictedParams,
): Promise<void> {
  const adminResult = createAdminClient();
  if (!adminResult.ok) {
    console.error("notifyListingRestricted admin:", adminResult.error);
    return;
  }

  const { client } = adminResult;

  const { data: post, error: postError } = await client
    .from("posts")
    .select("id, title, user_id")
    .eq("id", params.postId)
    .maybeSingle<{ id: number; title: string; user_id: string | null }>();

  if (postError || !post?.user_id) {
    console.error("notifyListingRestricted post:", postError ?? "no owner");
    return;
  }

  const recipientEmail = await resolveOwnerEmail(client, post.user_id);
  if (!recipientEmail) {
    console.error(
      "notifyListingRestricted: no email for user",
      post.user_id,
    );
    return;
  }

  const siteUrl = getSiteUrl();
  const emailContent = buildListingRestrictedEmail({
    postTitle: post.title,
    myListingsUrl: `${siteUrl}/moje-inzeraty`,
    vopUrl: `${siteUrl}${VOP_PATH}`,
    dsaUrl: `${siteUrl}${DSA_CONTACT_PATH}`,
    action: params.action,
    reasonCode: params.reasonCode,
    reasonDetail: params.reasonDetail,
  });

  await sendTransactionalEmail({
    to: recipientEmail,
    subject: emailContent.subject,
    text: emailContent.text,
  });
}
