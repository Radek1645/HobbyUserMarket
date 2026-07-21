/** Hard stop — blacklist účtů podle e-mailu (migrace 055). */

export const ACCOUNT_BLACKLIST_SOURCE = {
  automatic: "automatic",
  manual: "manual",
} as const;

export type AccountBlacklistSource =
  (typeof ACCOUNT_BLACKLIST_SOURCE)[keyof typeof ACCOUNT_BLACKLIST_SOURCE];

/** Automatický důvod při 3 hard rejectech / 24 h. */
export const ACCOUNT_BLACKLIST_REASON_AUTOMATIC = "3_hard_rejects_24h";

/** Stop stránka pro blacklisted účet. */
export const ACCOUNT_SUSPENDED_PATH = "/ucet-pozastaven";

/**
 * Retence evidence hard-stop / CSAM gate + historie unban záznamů (dny).
 * Aktivní blacklist se jen kvůli věku nemaže.
 */
export const HARD_STOP_EVIDENCE_RETENTION_DAYS = 730;

export function normalizeBlacklistEmail(email: string): string {
  return email.trim().toLowerCase();
}
