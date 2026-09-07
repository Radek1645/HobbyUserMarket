/** E-maily k platnosti inzerátu (PRD §9.7, Metodika §9.1.2). */

/** Kolik dní před `expires_at` poslat upozornění (denní cron). */
export const LISTING_EXPIRY_WARNING_DAYS_BEFORE = 3;

/** Max. počet inzerátů zpracovaných jedním během cronu (výstraha i stažení). */
export const LISTING_EXPIRY_WARNING_BATCH_LIMIT = 200;

/** Max. počet e-mailů „inzerát stažen“ na jeden běh archive-expired. */
export const LISTING_EXPIRY_NOTICE_BATCH_LIMIT =
  LISTING_EXPIRY_WARNING_BATCH_LIMIT;
