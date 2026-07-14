import { NextResponse } from "next/server";
import { Resend } from "resend";
import {
  INQUIRY_GENERIC_ERROR,
  INQUIRY_HONEYPOT_ERROR,
  INQUIRY_RATE_LIMIT_IP_ERROR,
  INQUIRY_RATE_LIMIT_POST_ERROR,
  INQUIRY_SERVICE_UNAVAILABLE_ERROR,
  INQUIRY_UNAVAILABLE_ERROR,
} from "@/lib/inquiry/api-errors";
import { getClientIpAddress } from "@/lib/inquiry/client-ip";
import { buildInquiryEmail, extractReplyTo } from "@/lib/inquiry/email";
import {
  assertInquiryRateLimit,
  markInquiryDelivered,
  recordInquiryAttempt,
} from "@/lib/inquiry/rate-limit";
import { resolveOwnerEmail } from "@/lib/inquiry/resolve-owner-email";
import { inquirySendErrorMessage } from "@/lib/inquiry/send-error";
import {
  isInquiryHoneypotFilled,
  validateInquiryPayload,
} from "@/lib/inquiry/validation";
import { getListingPath } from "@/lib/posts/listing-path";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteUrl } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { CategoryType, PostRow } from "@/types/post";

export async function POST(request: Request) {
  const clientIp = getClientIpAddress(request);

  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.INQUIRY_FROM_EMAIL;

  if (!resendKey || !fromEmail) {
    console.error("inquiry: missing RESEND_API_KEY or INQUIRY_FROM_EMAIL");
    return NextResponse.json(
      { error: INQUIRY_SERVICE_UNAVAILABLE_ERROR },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Neplatný JSON." }, { status: 400 });
  }

  if (isInquiryHoneypotFilled(body)) {
    return NextResponse.json({ error: INQUIRY_HONEYPOT_ERROR }, { status: 400 });
  }

  const postId = Number((body as { postId?: unknown })?.postId);
  if (!Number.isInteger(postId) || postId < 1) {
    return NextResponse.json({ error: "Neplatný inzerát." }, { status: 400 });
  }

  const adminResult = createAdminClient();
  if (!adminResult.ok) {
    console.error("inquiry admin client:", adminResult.error);
    return NextResponse.json(
      { error: INQUIRY_SERVICE_UNAVAILABLE_ERROR },
      { status: 503 },
    );
  }

  const rateLimit = await assertInquiryRateLimit(
    adminResult.client,
    clientIp,
    postId,
  );

  if (!rateLimit.ok) {
    if (rateLimit.reason === "ip") {
      return NextResponse.json(
        { error: INQUIRY_RATE_LIMIT_IP_ERROR },
        { status: 429 },
      );
    }
    if (rateLimit.reason === "post") {
      return NextResponse.json(
        { error: INQUIRY_RATE_LIMIT_POST_ERROR },
        { status: 429 },
      );
    }
    return NextResponse.json(
      { error: INQUIRY_SERVICE_UNAVAILABLE_ERROR },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("id, title, slug, category_type, status, expires_at, user_id, job_cv_required")
    .eq("id", postId)
    .maybeSingle<
      Pick<
        PostRow,
        | "id"
        | "title"
        | "slug"
        | "category_type"
        | "status"
        | "user_id"
        | "job_cv_required"
      > & {
        expires_at: string | null;
      }
    >();

  if (postError) {
    console.error("inquiry post lookup:", postError);
    return NextResponse.json({ error: INQUIRY_GENERIC_ERROR }, { status: 500 });
  }

  if (!post) {
    return NextResponse.json({ error: "Inzerát nenalezen." }, { status: 404 });
  }

  if (post.status !== "active") {
    return NextResponse.json({ error: "Inzerát není aktivní." }, { status: 404 });
  }

  if (post.expires_at && new Date(post.expires_at) <= new Date()) {
    return NextResponse.json({ error: "Platnost inzerátu vypršela." }, { status: 404 });
  }

  const validated = validateInquiryPayload(body, post.category_type as CategoryType, {
    jobCvRequired: post.job_cv_required === true,
  });
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && user.id === post.user_id) {
    return NextResponse.json(
      { error: "Na vlastní inzerát nemůžete reagovat." },
      { status: 400 },
    );
  }

  const attempt = await recordInquiryAttempt(adminResult.client, {
    postId,
    ipAddress: clientIp,
    viewerUserId: user?.id ?? null,
  });

  if (!attempt.ok) {
    return NextResponse.json(
      { error: INQUIRY_SERVICE_UNAVAILABLE_ERROR },
      { status: 503 },
    );
  }

  const ownerEmail = await resolveOwnerEmail(adminResult.client, post.user_id);

  if (!ownerEmail) {
    console.error("inquiry: owner email not found for user", post.user_id);
    return NextResponse.json(
      { error: INQUIRY_UNAVAILABLE_ERROR },
      { status: 422 },
    );
  }

  const emailContent = buildInquiryEmail({
    ...validated.data,
    postTitle: post.title,
    postListingUrl: `${getSiteUrl()}${getListingPath(post.slug)}`,
    categoryType: post.category_type as CategoryType,
  });

  const resend = new Resend(resendKey);

  const { error: sendError } = await resend.emails.send({
    from: fromEmail,
    to: ownerEmail,
    replyTo: extractReplyTo(validated.data.senderContact),
    subject: emailContent.subject,
    text: emailContent.text,
    attachments: validated.data.attachments?.map((att) => ({
      filename: att.filename,
      content: Buffer.from(att.content, "base64"),
    })),
  });

  if (sendError) {
    console.error("inquiry send:", sendError);
    return NextResponse.json(
      { error: inquirySendErrorMessage(sendError) },
      { status: 502 },
    );
  }

  await markInquiryDelivered(adminResult.client, attempt.id);

  return NextResponse.json({ ok: true });
}
