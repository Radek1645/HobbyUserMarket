import { OPERATOR_CONTACT_EMAIL } from "@/config/app";
import { SITE_DISPLAY_NAME } from "@/config/site";
import {
  BLOCKED_LISTING_RECOVERY_HINT,
  getPostStatusReasonMessage,
} from "@/config/listing-status-reasons";
import type { PostStatusReasonCode } from "@/types/post";

export type ListingRestrictionAction = "blocked" | "deleted";

type BuildListingRestrictedEmailParams = {
  postTitle: string;
  myListingsUrl: string;
  vopUrl: string;
  dsaUrl: string;
  action: ListingRestrictionAction;
  reasonCode: PostStatusReasonCode;
  reasonDetail?: string;
};

function legalBasis(reasonCode: PostStatusReasonCode): string {
  if (reasonCode === "reports_threshold") {
    return "Pravidla inzerce (§4) a VOP (§4.5) — inzerát byl nahlášen třemi různými uživateli.";
  }
  return "VOP (§4.5) a Pravidla inzerce — rozhodnutí moderátora platformy.";
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
    "Inzerát porušuje pravidla platformy nebo zákon.";
  const detail = params.reasonDetail?.trim();
  const appealLines = [
    `Stížnost nebo odvolání: ${params.dsaUrl}`,
    OPERATOR_CONTACT_EMAIL
      ? `Kontakt provozovatele: ${OPERATOR_CONTACT_EMAIL}`
      : null,
    `Podrobnosti: ${params.dsaUrl} (VOP §4.7)`,
  ].filter(Boolean);

  const recoveryBlock =
    params.action === "blocked"
      ? `\n\n${BLOCKED_LISTING_RECOVERY_HINT}\nSpráva inzerátů: ${params.myListingsUrl}`
      : "";

  const text = `Dobrý den,

váš inzerát „${params.postTitle}" byl ${actionLabel(params.action)}.

Důvod opatření:
${reason}${detail ? `\n\nDoplňující informace:\n${detail}` : ""}

Právní / smluvní základ:
${legalBasis(params.reasonCode)}

Související dokumentace: ${params.vopUrl} (VOP §4.6)${recoveryBlock}

${appealLines.join("\n")}

---
${SITE_DISPLAY_NAME}
`;

  return {
    subject: `${actionSubject(params.action)}: ${params.postTitle}`,
    text,
  };
}
