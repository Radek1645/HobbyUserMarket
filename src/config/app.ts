/** Globální parametry aplikace — PRD §3, §9.3 */

/** Adaptivní kroky rádiusu pro homepage (km) — od nejmenšího po max. */
export const SEARCH_RADIUS_STEPS_KM = [15, 30, 50, 60] as const;
/** Výchozí (nejmenší) krok — zpětná kompatibilita v UI. */
export const SEARCH_RADIUS_KM = SEARCH_RADIUS_STEPS_KM[0];
/** Minimální počet inzerátů v okruhu; pod tím fallback na celostátní výpis. */
export const HOME_LISTINGS_MIN_REQUIRED = 6;
/** Počet karet na homepage po aplikaci filtru (max. z načtené dávky). */
export const HOME_LISTINGS_LIMIT = 9;
/** Kolik inzerátů načíst z API — větší pool pro filtrování podkategorií na klientovi. */
export const HOME_LISTINGS_FETCH_LIMIT = 36;

/** Fulltext vyhledávání — PRD §5.2 */
export const SEARCH_QUERY_MIN_LENGTH = 3;
export const SEARCH_QUERY_MAX_LENGTH = 100;

export const LISTING_DURATION_DEFAULT_DAYS = 30;
export const LISTING_DURATION_MIN_DAYS = 1;
export const LISTING_DURATION_MAX_DAYS = 365;

/** Presety pro select — žádné slidery (mobilní UX) */
export const LISTING_DURATION_PRESETS = [7, 14, 30, 60, 90, 180, 365] as const;

export const LISTING_DESCRIPTION_MIN_LENGTH = 10;
export const LISTING_DESCRIPTION_MAX_LENGTH = 1000;
export const LISTING_EXCHANGE_FOR_MAX_LENGTH = 100;

/** Fotky inzerátu — PRD §5.4, max 6 */
export const LISTING_IMAGE_MAX_FILES = 6;
/** Max. velikost fotky po kompresi na klientovi (uložený soubor + validace serveru). */
export const LISTING_IMAGE_MAX_FILE_BYTES = 1 * 1024 * 1024;
/** Max. velikost vstupního souboru před kompresí (snímek z foťáku / galerie). */
export const LISTING_IMAGE_MAX_SOURCE_BYTES = 25 * 1024 * 1024;
/** Nejdelší strana po resize před enkódováním. */
export const LISTING_IMAGE_MAX_DIMENSION = 1920;
/** Výchozí kvalita enkódování (WebP/JPEG) — dále se snižuje, dokud není soubor ≤ 1 MB. */
export const LISTING_IMAGE_COMPRESS_QUALITY = 0.82;
/** Limit těla Server Action při odeslání formuláře s fotkami (next.config serverActions.bodySizeLimit). */
export const LISTING_IMAGE_MAX_UPLOAD_BYTES =
  LISTING_IMAGE_MAX_FILES * LISTING_IMAGE_MAX_FILE_BYTES + 512 * 1024;
export const LISTING_IMAGE_BUCKET = "post-images";
export const LISTING_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp";
export const LISTING_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"] as const;

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
