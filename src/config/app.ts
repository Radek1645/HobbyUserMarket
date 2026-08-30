/** Globální parametry aplikace — PRD §3, §9.3 */

import { SITE_OPERATOR_CONTACT_EMAIL } from "@/config/site";
import { TURNSTILE_ACTION } from "@/config/turnstile";

/** Adaptivní kroky rádiusu pro homepage (km) — od nejmenšího po max. */
export const SEARCH_RADIUS_STEPS_KM = [15, 30, 50, 60] as const;
/** Výchozí (nejmenší) krok — zpětná kompatibilita v UI. */
export const SEARCH_RADIUS_KM = SEARCH_RADIUS_STEPS_KM[0];
/** Minimální počet inzerátů v okruhu; pod tím fallback na celostátní výpis. */
export const HOME_LISTINGS_MIN_REQUIRED = 6;
/** Homepage — desktop mřížka 3×3. */
export const HOME_LISTINGS_LIMIT_DESKTOP = 9;
/** Homepage — mobil mřížka 2×4. */
export const HOME_LISTINGS_LIMIT_MOBILE = 8;
/** Alias desktop limitu (zpětná kompatibilita). */
export const HOME_LISTINGS_LIMIT = HOME_LISTINGS_LIMIT_DESKTOP;
/** Tailwind `lg` breakpoint (px) — shodný s `lg:grid-cols-3` na výpisu. */
export const HOME_LISTINGS_DESKTOP_MIN_WIDTH_PX = 1024;
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
export const LISTING_DESCRIPTION_MAX_LENGTH = 2000;
/** Rezerva znaků v cleanedDescription při NEEDS_QUESTIONS — doplní se odpovědi z dotazníku. */
export const MODERATION_DESCRIPTION_QA_RESERVE = 400;
export const LISTING_EXCHANGE_FOR_MAX_LENGTH = 100;
/** Volitelný odkaz u události (FB / web). */
export const EXTERNAL_URL_MAX_LENGTH = 500;

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
export const MODERATION_IMAGE_STAGING_BUCKET = "moderation-image-staging";
export const MODERATION_IMAGE_RENDITION_BUCKET = "moderation-image-renditions";
export const MODERATION_IMAGE_STAGING_RETENTION_HOURS = 24;
export const LISTING_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp";
/** Galerie — `image/*` (Samsung Photo Picker). Úzký MIME seznam otevírá Správce souborů a URI ztratí oprávnění. */
export const LISTING_IMAGE_GALLERY_ACCEPT = "image/*";
/** Foťák — `image/*` + `capture`, jinak Android otevře jen galerii. */
export const LISTING_IMAGE_CAMERA_ACCEPT = "image/*";
export const LISTING_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"] as const;

/**
 * Limity přesných Storage objektů, které Edge hashuje pro SEC-H02.
 * AI dostává menší varianty odvozené důvěryhodnou Server Action přes Sharp.
 */
export const MODERATION_IMAGE_MAX_BYTES = LISTING_IMAGE_MAX_FILE_BYTES;
export const MODERATION_IMAGES_MAX_TOTAL_BYTES =
  LISTING_IMAGE_MAX_FILES * LISTING_IMAGE_MAX_FILE_BYTES;

/** Minimální délka hesla — registrace i nastavení hesla. */
export const PASSWORD_MIN_LENGTH = 8;

/** Cooldown před opětovným odesláním ověřovacího e-mailu (U21). */
export const VERIFICATION_RESEND_COOLDOWN_MS = 60_000;

/** Serverové limity opětovného odeslání ověřovacího e-mailu (SEC-M09). */
export const VERIFICATION_RESEND_IP_LIMIT_PER_HOUR = 10;
export const VERIFICATION_RESEND_EMAIL_LIMIT_PER_HOUR = 3;
export const VERIFICATION_RESEND_RATE_ACTION =
  TURNSTILE_ACTION.RESEND_SIGNUP_VERIFICATION;

/**
 * Max. stáří AMR `recovery` (nebo JWT `iat` u string AMR) pro `/auth/nastavit-heslo`.
 * SEC-M10 — bez čerstvé recovery session nesmí jít měnit heslo bez stávajícího.
 */
export const PASSWORD_RECOVERY_SESSION_MAX_AGE_SECONDS = 60 * 60;

/** Max. doba dopředu pro datum události */
export const EVENT_DATE_MAX_DAYS_AHEAD = 365;

/** Odhalení kontaktu — PRD §5.3, max 20 zobrazení / den / uživatel.
 *  Vynuceno v DB (reveal_listing_contact RPC); tato konstanta drží hodnotu pro UI hlášku. */
export const CONTACT_REVEAL_RATE_LIMIT_PER_DAY = 20;

/** Výchozí počet lifetime publikací inzerátů pro nový účet (balíček `free`). */
export const LISTING_QUOTA_FREE_DEFAULT = 20;

/** Slug balíčku zobrazeného v UI pro dokoupení kreditu. */
export const LISTING_UPSELL_PACKAGE_SLUG = "standard_20";

/**
 * Veřejný kontakt provozovatele (UI, SoR, mailto).
 * Vždy `info@…` — ne osobní gmail z env (to patří do serverového `OPERATOR_CONTACT_EMAIL` pro admin notifikace).
 */
export const OPERATOR_CONTACT_EMAIL = SITE_OPERATOR_CONTACT_EMAIL;

/** Poptávkový formulář — PRD §5.3, docs/future_jobs.md */
export const INQUIRY_MESSAGE_MIN_LENGTH = 10;
export const INQUIRY_MESSAGE_MAX_LENGTH = 1000;
export const INQUIRY_SENDER_NAME_MAX_LENGTH = 80;
export const INQUIRY_RATE_LIMIT_PER_DAY = 20;
/** Max. poptávek z jedné IP na stejný inzerát za 24 h (H2/P15). */
export const INQUIRY_RATE_LIMIT_PER_POST_PER_DAY = 3;

/** Honeypot pole — musí zůstat prázdné (P16). */
export const INQUIRY_HONEYPOT_FIELD = "website";

/**
 * Zobrazení detailu inzerátu (klientské statistiky, mimo GA4).
 * Dedup okno je vynuceno v RPC `record_listing_view` (24 h).
 */
export const LISTING_VIEW_DEDUP_HOURS = 24;
/** Max. zápisů zobrazení z jedné IP za 24 h (anti-spam). */
export const LISTING_VIEW_RATE_LIMIT_PER_IP_PER_DAY = 200;

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
