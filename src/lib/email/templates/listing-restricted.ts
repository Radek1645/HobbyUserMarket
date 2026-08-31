import { OPERATOR_CONTACT_EMAIL } from "@/config/app";
import { SITE_DISPLAY_NAME } from "@/config/site";
import {
  BLOCKED_LISTING_RECOVERY_HINT,
  getPostStatusReasonMessage,
} from "@/config/listing-status-reasons";
import type { PostStatusReasonCode } from "@/types/post";

export type ListingRestrictionAction = "blocked" | "deleted";

/** Statement of Reasons — automat vs. hlášení vs. člověk (DSA / VOP čl. 4). */
export type ListingRestrictionSource = "reports" | "moderator" | "automatic";

type BuildListingRestrictedEmailParams = {
  postTitle: string;
  myListingsUrl: string;
  vopUrl: string;
  dsaUrl: string;
  action: ListingRestrictionAction;
  reasonCode: PostStatusReasonCode;
  reasonDetail?: string;
  source: ListingRestrictionSource;
};

function legalBasis(reasonCode: PostStatusReasonCode): string {
  if (reasonCode === "reports_threshold") {
    return "Pravidla inzerce a VOP čl. 4 — inzerát byl nahlášen třemi různými uživateli.";
  }
  return "VOP čl. 4 a Pravidla inzerce — rozhodnutí moderátora webu.";
}

function sourceLabel(source: ListingRestrictionSource): string {
  if (source === "reports") {
    return "hlášení uživatelů (automatické skrytí po třech nezávislých hlášeních)";
  }
  if (source === "automatic") {
    return "automatické rozhodnutí systému";
  }
  return "rozhodnutí moderátora";
}

export function listingRestrictionSourceFromReason(
  reasonCode: PostStatusReasonCode,
): ListingRestrictionSource {
  if (reasonCode === "reports_threshold") return "reports";
  if (reasonCode === "moderation") return "moderator";
  return "automatic";
}

function actionLabel(action: ListingRestrictionAction): string {
  return action === "blocked" ? "zablokován (skryt)" : "odstraněn";
}

function actionSubject(action: ListingRestrictionAction): string {
  return action === "blocked"
    ? "Inzerát byl zablokován"
    : "Inzerát byl odstraněn";
}

export function buildListingRestrictedEmail(
  params: BuildListingRestrictedEmailParams,
): { subject: string; text: string } {
  const reason =
    getPostStatusReasonMessage(params.reasonCode) ??
    "Inzerát porušuje pravidla webu nebo zákon.";
  const detail = params.reasonDetail?.trim();
  const appealLines = [
    `Odvolání proti tomuto opatření můžete podat do 6 měsíců od doručení tohoto oznámení: ${params.dsaUrl}`,
    OPERATOR_CONTACT_EMAIL
      ? `Kontakt provozovatele: ${OPERATOR_CONTACT_EMAIL}`
      : null,
  ].filter(Boolean);

  const recoveryBlock =
    params.action === "blocked"
      ? `\n\n${BLOCKED_LISTING_RECOVERY_HINT}\nSpráva inzerátů: ${params.myListingsUrl}`
      : "";

  const text = `Dobrý den,

váš inzerát „${params.postTitle}" byl ${actionLabel(params.action)}.

Zdroj opatření:
${sourceLabel(params.source)}

Důvod opatření:
${reason}${detail ? `\n\nDoplňující informace:\n${detail}` : ""}

Právní / smluvní základ:
${legalBasis(params.reasonCode)}

Související dokumentace: ${params.vopUrl} (VOP čl. 4)${recoveryBlock}

${appealLines.join("\n")}

---
${SITE_DISPLAY_NAME}
`;

  return {
    subject: `${actionSubject(params.action)}: ${params.postTitle}`,
    text,
  };
}
