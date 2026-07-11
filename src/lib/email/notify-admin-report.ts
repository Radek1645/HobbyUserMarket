import { buildAdminReportEmail } from "@/lib/email/templates/admin-report";
import { getAdminNotificationEmail } from "@/lib/email/get-admin-notification-email";
import { sendTransactionalEmail } from "@/lib/email/send";
import { getListingPath } from "@/lib/posts/listing-path";
import { getSiteUrl } from "@/lib/supabase/env";

export type NotifyAdminReportParams = {
  postTitle: string;
  postSlug: string;
  reason: string;
  source: "inline" | "standalone";
  reportCount: number;
  detailText?: string;
  reporterEmail?: string;
};

/** Notifikace adminovi — nevyhazuje výjimku při chybě odeslání. */
export async function notifyAdminReport(
  params: NotifyAdminReportParams,
): Promise<void> {
  const adminEmail = getAdminNotificationEmail();
  if (!adminEmail) {
    console.error("notifyAdminReport: missing ADMIN_NOTIFICATION_EMAIL");
    return;
  }

  const siteUrl = getSiteUrl();
  const emailContent = buildAdminReportEmail({
    listingTitle: params.postTitle,
    listingUrl: `${siteUrl}${getListingPath(params.postSlug)}`,
    quarantineUrl: `${siteUrl}/mod/karantena`,
    reason: params.reason,
    source: params.source,
    reportCount: params.reportCount,
    detailText: params.detailText,
    reporterEmail: params.reporterEmail,
  });

  await sendTransactionalEmail({
    to: adminEmail,
    subject: emailContent.subject,
    text: emailContent.text,
  });
}
