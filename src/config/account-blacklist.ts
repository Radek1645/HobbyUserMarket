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

export function normalizeBlacklistEmail(email: string): string {
  return email.trim().toLowerCase();
}
