import {
  INQUIRY_ATTACHMENT_ALLOWED_EXTENSIONS,
  INQUIRY_ATTACHMENT_MAX_FILES,
  INQUIRY_ATTACHMENT_MAX_TOTAL_BYTES,
  INQUIRY_MESSAGE_MAX_LENGTH,
  INQUIRY_MESSAGE_MIN_LENGTH,
  INQUIRY_SENDER_NAME_MAX_LENGTH,
} from "@/config/app";
import type { CategoryType } from "@/types/post";

export type InquiryAttachmentInput = {
  filename: string;
  content: string;
  contentType: string;
};

export type InquiryPayload = {
  postId: number;
  senderName: string;
  senderContact: string;
  message: string;
  attachments?: InquiryAttachmentInput[];
};

const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
]);

const EXTENSION_TO_MIME: Record<string, string> = {
  ".pdf": "application/pdf",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

export function sanitizeFilename(raw: string): string {
  const base = raw.split(/[/\\]/).pop() ?? "priloha";
  const cleaned = base.replace(/[^\w.\- ()áčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]/g, "_");
  return cleaned.slice(0, 120) || "priloha";
}

function getExtension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  if (dot < 0) return "";
  return filename.slice(dot).toLowerCase();
}

export function validateInquiryPayload(
  body: unknown,
  categoryType: CategoryType,
): { ok: true; data: InquiryPayload } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Neplatný požadavek." };
  }

  const record = body as Record<string, unknown>;
  const postId = Number(record.postId);
  const senderName = String(record.senderName ?? "").trim();
  const senderContact = String(record.senderContact ?? "").trim();
  const message = String(record.message ?? "").trim();

  if (!Number.isInteger(postId) || postId < 1) {
    return { ok: false, error: "Neplatný inzerát." };
  }

  if (senderName.length < 1 || senderName.length > INQUIRY_SENDER_NAME_MAX_LENGTH) {
    return { ok: false, error: "Jméno musí mít 1–80 znaků." };
  }

  if (senderContact.length < 5) {
    return { ok: false, error: "Zadej e-mail nebo telefon pro zpětnou vazbu." };
  }

  if (message.length < INQUIRY_MESSAGE_MIN_LENGTH) {
    return {
      ok: false,
      error: `Zpráva musí mít alespoň ${INQUIRY_MESSAGE_MIN_LENGTH} znaků.`,
    };
  }

  if (message.length > INQUIRY_MESSAGE_MAX_LENGTH) {
    return {
      ok: false,
      error: `Zpráva může mít maximálně ${INQUIRY_MESSAGE_MAX_LENGTH} znaků.`,
    };
  }

  let attachments: InquiryAttachmentInput[] | undefined;

  if (record.attachments != null) {
    if (categoryType !== "prace") {
      return { ok: false, error: "Přílohy jsou povoleny jen u nabídek práce." };
    }

    if (!Array.isArray(record.attachments)) {
      return { ok: false, error: "Neplatný formát příloh." };
    }

    if (record.attachments.length > INQUIRY_ATTACHMENT_MAX_FILES) {
      return {
        ok: false,
        error: `Maximálně ${INQUIRY_ATTACHMENT_MAX_FILES} přílohy.`,
      };
    }

    attachments = [];
    let totalBytes = 0;

    for (const item of record.attachments) {
      if (!item || typeof item !== "object") {
        return { ok: false, error: "Neplatná příloha." };
      }

      const att = item as Record<string, unknown>;
      const filename = sanitizeFilename(String(att.filename ?? ""));
      const content = String(att.content ?? "");
      const contentType = String(att.contentType ?? "").toLowerCase();

      const ext = getExtension(filename);
      if (
        !INQUIRY_ATTACHMENT_ALLOWED_EXTENSIONS.includes(
          ext as (typeof INQUIRY_ATTACHMENT_ALLOWED_EXTENSIONS)[number],
        )
      ) {
        return {
          ok: false,
          error: `Nepovolený formát souboru: ${ext || filename}`,
        };
      }

      const expectedMime = EXTENSION_TO_MIME[ext];
      if (!expectedMime || contentType !== expectedMime || !ALLOWED_MIME.has(contentType)) {
        return { ok: false, error: `Nepovolený typ souboru: ${filename}` };
      }

      if (!content || !/^[A-Za-z0-9+/=]+$/.test(content)) {
        return { ok: false, error: "Neplatná příloha." };
      }

      let bytes: number;
      try {
        bytes = Buffer.from(content, "base64").byteLength;
      } catch {
        return { ok: false, error: "Neplatná příloha." };
      }

      if (bytes < 1) {
        return { ok: false, error: "Prázdná příloha." };
      }

      totalBytes += bytes;
      if (totalBytes > INQUIRY_ATTACHMENT_MAX_TOTAL_BYTES) {
        return {
          ok: false,
          error: "Celková velikost příloh nesmí přesáhnout 5 MB.",
        };
      }

      attachments.push({ filename, content, contentType });
    }
  }

  return {
    ok: true,
    data: {
      postId,
      senderName,
      senderContact,
      message,
      attachments: attachments?.length ? attachments : undefined,
    },
  };
}
