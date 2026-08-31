export const GDPR_RETENTION_DELETE_AFTER_DAYS = 90;
export const GDPR_RETENTION_WARNING_BEFORE_DAYS = 7;

export const GDPR_RETENTION_WARNING_AFTER_DAYS =
  GDPR_RETENTION_DELETE_AFTER_DAYS - GDPR_RETENTION_WARNING_BEFORE_DAYS;

export const GDPR_RETENTION_REASON_CODE = "gdpr_retention";

/** Telefon, GPS, původní text a fotky u archived/deleted inzerátů (VOP 2.1). */
export const LISTING_PII_PURGE_DAYS = 30;

/** `anonymous_rate_limits` a `rate_limits` — počítadla IP. */
export const RATE_LIMIT_PURGE_DAYS = 30;

/** Kopie fotky u hard-stop evidence ve storage; řádek tabulky drží RETENTION_MONTHS. */
export const EVIDENCE_IMAGE_DAYS = 90;

/** Zablokovaný inzerát bez opravy → deleted. */
export const BLOCKED_STALE_DAYS = 90;

/** Varování před překlopením blocked → deleted. */
export const BLOCKED_STALE_WARNING_DAYS = 7;

export const BLOCKED_STALE_WARNING_AFTER_DAYS =
  BLOCKED_STALE_DAYS - BLOCKED_STALE_WARNING_DAYS;

/** Řádek inzerátu a provozní tabulky (B2). */
export const RETENTION_MONTHS = 12;
