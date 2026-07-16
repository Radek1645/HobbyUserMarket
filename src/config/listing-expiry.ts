/** Upozornění e-mailem před expirací inzerátu (PRD §9.7). */

/** Kolik dní před `expires_at` poslat upozornění (denní cron). */
export const LISTING_EXPIRY_WARNING_DAYS_BEFORE = 3;

/** Max. počet inzerátů zpracovaných jedním během cronu. */
export const LISTING_EXPIRY_WARNING_BATCH_LIMIT = 200;
