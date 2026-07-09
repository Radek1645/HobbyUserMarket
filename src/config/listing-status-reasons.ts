/** Kódy důvodu stavu inzerátu — sloupec posts.status_reason_code (migrace 036). */
export type PostStatusReasonCode = "reports_threshold" | "moderation";

export const POST_STATUS_REASON_MESSAGES: Record<
  PostStatusReasonCode,
  string
> = {
  reports_threshold:
    "Inzerát byl nahlášen jako závadný třemi různými uživateli a byl skryt z veřejného zobrazení.",
  moderation:
    "Inzerát byl zablokován moderátorem, protože porušuje pravidla platformy nebo zákon.",
};

export const BLOCKED_LISTING_RECOVERY_HINT =
  "Chcete-li inzerát znovu zveřejnit, upravte obsah tak, aby odpovídal pravidlům, a odešlete ho znovu ke schválení.";

export function getPostStatusReasonMessage(
  code: PostStatusReasonCode | null | undefined,
): string | null {
  if (!code) return null;
  return POST_STATUS_REASON_MESSAGES[code] ?? null;
}
