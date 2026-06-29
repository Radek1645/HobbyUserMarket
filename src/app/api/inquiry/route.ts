import { NextResponse } from "next/server";
import { Resend } from "resend";
import { buildInquiryEmail, extractReplyTo } from "@/lib/inquiry/email";
import { resolveOwnerEmail } from "@/lib/inquiry/resolve-owner-email";
import { validateInquiryPayload } from "@/lib/inquiry/validation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { CategoryType, PostRow } from "@/types/post";

export async function POST(request: Request) {
  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.INQUIRY_FROM_EMAIL;

  if (!resendKey || !fromEmail) {
    return NextResponse.json(
      { error: "E-mailová služba není nakonfigurována." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Neplatný JSON." }, { status: 400 });
  }

  const postId = Number((body as { postId?: unknown })?.postId);
  if (!Number.isInteger(postId) || postId < 1) {
    return NextResponse.json({ error: "Neplatný inzerát." }, { status: 400 });
  }

  // Inzerát načítáme stejným klientem jako detail stránka (RLS: veřejně viditelné posty).
  // Service role se používá jen pro lookup e-mailu zadavatele v profiles.
  const supabase = await createClient();
  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("id, title, category_type, status, expires_at, user_id")
    .eq("id", postId)
    .maybeSingle<
      Pick<PostRow, "id" | "title" | "category_type" | "status" | "user_id"> & {
        expires_at: string | null;
      }
    >();

  if (postError) {
    console.error("inquiry post lookup:", postError);
    return NextResponse.json(
      { error: "Inzerát se nepodařilo načíst." },
      { status: 500 },
    );
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

  const validated = validateInquiryPayload(body, post.category_type as CategoryType);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && user.id === post.user_id) {
    return NextResponse.json(
      { error: "Na vlastní inzerát nemůžeš reagovat." },
      { status: 400 },
    );
  }

  const adminResult = createAdminClient();
  if (!adminResult.ok) {
    return NextResponse.json({ error: adminResult.error }, { status: 503 });
  }

  const ownerEmail = await resolveOwnerEmail(adminResult.client, post.user_id);

  if (!ownerEmail) {
    return NextResponse.json(
      {
        error:
          "Kontakt zadavatele není k dispozici. Spusť migraci 010_inquiry_recipient_email.sql a zkontroluj service_role klíč v .env.local.",
      },
      { status: 422 },
    );
  }

  const emailContent = buildInquiryEmail({
    ...validated.data,
    postTitle: post.title,
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
      { error: "Poptávku se nepodařilo odeslat. Zkus to později." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
