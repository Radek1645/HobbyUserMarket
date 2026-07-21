import type { PostStatusReasonCode } from "@/types/post";

/** Konstanty pro sloupec posts.status_reason_code (migrace 036). */
export const POST_STATUS_REASON = {
  reports_threshold: "reports_threshold",
  moderation: "moderation",
  lifetime_max: "lifetime_max",
  account_blacklist: "account_blacklist",
} as const satisfies Record<PostStatusReasonCode, PostStatusReasonCode>;

export const POST_STATUS_REASON_MESSAGES: Record<
  PostStatusReasonCode,
  string
> = {
  [POST_STATUS_REASON.reports_threshold]:
    "Inzerát byl nahlášen jako závadný třemi různými uživateli a byl skryt z veřejného zobrazení.",
  [POST_STATUS_REASON.moderation]:
    "Inzerát byl zablokován moderátorem, protože porušuje pravidla platformy nebo zákon.",
  [POST_STATUS_REASON.lifetime_max]:
    "Inzerát dosáhl maximální doby existence (365 dní od založení) a byl automaticky ukončen.",
  [POST_STATUS_REASON.account_blacklist]:
    "Inzerát byl skryt, protože účet porušil podmínky platformy (hard stop).",
};

export const BLOCKED_LISTING_RECOVERY_HINT =
  "Chcete-li inzerát znovu zveřejnit, upravte obsah tak, aby odpovídal pravidlům, a odešlete ho znovu ke schválení.";

export function getPostStatusReasonMessage(
  code: PostStatusReasonCode | null | undefined,
): string | null {
  if (!code) return null;
  return POST_STATUS_REASON_MESSAGES[code] ?? null;
}
