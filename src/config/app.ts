/** Globální parametry aplikace — PRD §3, §9.3 */

export const SEARCH_RADIUS_KM = 15;
/** Počet karet na homepage po aplikaci filtru (max. z načtené dávky). */
export const HOME_LISTINGS_LIMIT = 9;
/** Kolik inzerátů načíst z API — větší pool pro filtrování podkategorií na klientovi. */
export const HOME_LISTINGS_FETCH_LIMIT = 36;

export const LISTING_DURATION_DEFAULT_DAYS = 30;
export const LISTING_DURATION_MIN_DAYS = 1;
export const LISTING_DURATION_MAX_DAYS = 365;

/** Presety pro select — žádné slidery (mobilní UX) */
export const LISTING_DURATION_PRESETS = [7, 14, 30, 60, 90, 180, 365] as const;

export const LISTING_DESCRIPTION_MIN_LENGTH = 10;
export const LISTING_DESCRIPTION_MAX_LENGTH = 1000;
export const LISTING_EXCHANGE_FOR_MAX_LENGTH = 100;

/** Max. doba dopředu pro datum události */
export const EVENT_DATE_MAX_DAYS_AHEAD = 365;

/** Poptávkový formulář — PRD §5.3, docs/future_jobs.md */
export const INQUIRY_MESSAGE_MIN_LENGTH = 10;
export const INQUIRY_MESSAGE_MAX_LENGTH = 1000;
export const INQUIRY_SENDER_NAME_MAX_LENGTH = 80;
export const INQUIRY_RATE_LIMIT_PER_DAY = 20;

export const INQUIRY_ATTACHMENT_MAX_FILES = 3;
export const INQUIRY_ATTACHMENT_MAX_TOTAL_BYTES = 5 * 1024 * 1024;
export const INQUIRY_ATTACHMENT_ALLOWED_EXTENSIONS = [
  ".pdf",
  ".docx",
  ".jpg",
  ".jpeg",
  ".png",
] as const;

export function clampListingDurationDays(days: number): number {
  return Math.min(
    LISTING_DURATION_MAX_DAYS,
    Math.max(LISTING_DURATION_MIN_DAYS, Math.round(days)),
  );
}
