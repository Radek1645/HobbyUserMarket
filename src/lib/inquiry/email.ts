import type { CategoryType } from "@/types/post";
import type { InquiryPayload } from "./validation";

export function buildInquiryEmail(payload: InquiryPayload & {
  postTitle: string;
  categoryType: CategoryType;
}) {
  const { senderName, senderContact, message, postTitle, categoryType, attachments } =
    payload;

  let subject: string;
  let intro: string;

  switch (categoryType) {
    case "udalost":
      subject = `Zájem o účast: ${postTitle}`;
      intro = `Uživatel ${senderName} se chce zúčastnit vaší akce „${postTitle}".`;
      break;
    case "prace":
      subject = `Odpověď na nabídku: ${postTitle}`;
      intro = `Uživatel ${senderName} reaguje na vaši pracovní nabídku „${postTitle}".`;
      break;
    default:
      subject = `Poptávka: ${postTitle}`;
      intro = `Uživatel ${senderName} má zájem o váš inzerát „${postTitle}".`;
  }

  const attachmentNote =
    attachments && attachments.length > 0
      ? `\n\nPřílohy (${attachments.length}): ${attachments.map((a) => a.filename).join(", ")}`
      : "";

  const text = `${intro}

Kontakt zájemce: ${senderContact}

Zpráva:
${message}${attachmentNote}

---
Odpověz přímo ze své e-mailové schránky. HobbyUserMarket uchovává kontakt uchazeče pouze v tomto e-mailu.
`;

  return { subject, text };
}

export function extractReplyTo(contact: string): string | undefined {
  const trimmed = contact.trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return trimmed;
  }
  return undefined;
}
