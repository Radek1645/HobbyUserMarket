export {
  buildModerationSystemPrompt,
} from "@/config/moderation/build-prompt";
export {
  ACCOUNT_SUSPENDED_UI,
  LISTING_AI_DISCLOSURE,
  LISTING_AI_DISCLOSURE_LABEL,
  LISTING_TERMS_PATH,
  MODERATION_APPROVED_UI,
  MODERATION_CHECKING_UI,
  MODERATION_DEFAULT_REJECTION_REASON,
  MODERATION_GEMINI_QUOTA_ERROR,
  MODERATION_HARD_HIT_TEXT_REASON,
  MODERATION_NSFW_IMAGE_REASON,
  MODERATION_PREVIEW_UI,
  MODERATION_RATE_LIMIT_MESSAGE,
  MODERATION_REJECTION_UI,
  MODERATION_SIGHTENGINE_UNAVAILABLE,
  MODERATION_TECHNICAL_ERROR,
  MODERATION_TECHNICAL_UI,
} from "@/config/moderation/messages";
export {
  getProhibitedTopic,
  getProhibitedTopicsSummaryLabels,
  PROHIBITED_TOPICS,
  type ProhibitedTopic,
  type ProhibitedTopicId,
} from "@/config/moderation/prohibited-topics";
export {
  HARD_HIT_CATEGORIES,
  type HardHitCategory,
  type HardHitCategoryId,
} from "@/config/moderation/hard-hit-terms";

/**
 * Volá Edge Function `moderate-listing` před uložením (create i edit).
 * POZOR (H1): publikace vyžaduje approval token z Edge Function — vypnutí
 * tohoto flagu tedy NEobejde moderaci, jen zablokuje publikaci nových
 * inzerátů (zůstanou v 'draft'). DB gate viz supabase/027.
 */
export const MODERATION_ENABLED = true;

/** Max. AI kontrol / hodinu / uživatel (PRD). */
export const MODERATION_RATE_LIMIT_PER_HOUR = 20;

export const MODERATION_FUNCTION_NAME = "moderate-listing" as const;

/** Max. doplňujících otázek v NEEDS_QUESTIONS (hard limit v parse-response). */
export const MODERATION_MAX_QUESTIONS = 5;

/** Nejdelší strana snímku posílaného do AI (bezpečnostní filtr všech fotek). */
export const MODERATION_IMAGE_MAX_DIMENSION = 512;
export const MODERATION_IMAGE_COMPRESS_QUALITY = 0.82;

/** P11: počet pokusů volání Edge Function při technické chybě (1 + retry). */
export const MODERATION_CLIENT_MAX_ATTEMPTS = 3;

/** Prodlevy mezi retry (ms) — jen pro `kind: "error"`, ne pro obsahové REJECTED. */
export const MODERATION_CLIENT_RETRY_DELAYS_MS = [500, 1500] as const;

/** Sightengine nudity-2.1 — práh pro sexual_activity / sexual_display (≈ legacy raw). */
export const NSFW_NUDITY_RAW_THRESHOLD = 0.6;

/** Sightengine nudity-2.1 — práh pro erotica (≈ legacy partial). */
export const NSFW_NUDITY_PARTIAL_THRESHOLD = 0.8;

/** Timeout Sightengine check (ms). */
export const SIGHTENGINE_FETCH_TIMEOUT_MS = 5_000;

/**
 * Po N hard rejectech (text+NSFW) v 24 h → hard stop (blacklist e-mailu).
 */
export const HARD_REJECT_AUTOBAN_THRESHOLD = 3;

/** Rolling window pro hard-reject counter (ms). */
export const HARD_REJECT_WINDOW_MS = 24 * 60 * 60 * 1000;

export const MODERATION_EVIDENCE_BUCKET = "moderation-evidence" as const;

export {
  ACCOUNT_BLACKLIST_REASON_AUTOMATIC,
  ACCOUNT_BLACKLIST_SOURCE,
  ACCOUNT_SUSPENDED_PATH,
  HARD_STOP_EVIDENCE_RETENTION_DAYS,
  normalizeBlacklistEmail,
  type AccountBlacklistSource,
} from "@/config/account-blacklist";
