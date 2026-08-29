/**
 * Guest listing draft (FB funnel C) — feature flag a limity.
 * AI preview bez loginu; publish vždy po auth + nové final AI.
 */
export const GUEST_LISTING_DRAFT_ENABLED =
  process.env.NEXT_PUBLIC_GUEST_LISTING_DRAFT_ENABLED === "true";

/** Soft IP limit před povinným Turnstile (preview / hodina). */
export const GUEST_AI_SOFT_LIMIT_PER_HOUR = 2;

/** Hard IP limit (preview / hodina) — i s captcha. */
export const GUEST_AI_IP_LIMIT_PER_HOUR = 5;

/** Soft visitor limit (preview / hodina). */
export const GUEST_AI_VISITOR_LIMIT_PER_HOUR = 5;

/** Hard visitor limit (preview / hodina). */
export const GUEST_AI_VISITOR_HARD_LIMIT_PER_HOUR = 5;

/**
 * Guest photo-prefill (`guest_suggest_from_photos`) — oddělené od AI preview.
 * Soft = hard → až 5×/h bez captcha (soft spouští captcha až na stropu).
 */
export const GUEST_SUGGEST_SOFT_LIMIT_PER_HOUR = 5;
export const GUEST_SUGGEST_IP_LIMIT_PER_HOUR = 5;
export const GUEST_SUGGEST_VISITOR_LIMIT_PER_HOUR = 5;

/** Nové visitor cookie / hodina / IP — reuse existující cookie se nepočítá. */
export const GUEST_VISITOR_MINT_LIMIT_PER_HOUR = 10;

export const GUEST_VISITOR_MINT_RATE_ACTION = "guest_visitor_mint";

/**
 * Globální strop placeného guest AI (preview + prefill) napříč všemi IP.
 * Per-identita limity ztrátu neohraničí.
 */
export const GUEST_AI_GLOBAL_LIMIT_PER_HOUR = 40;

export const GUEST_AI_GLOBAL_LIMIT_PER_DAY = 300;

export const GUEST_AI_GLOBAL_RATE_ACTION = "guest_ai_spend";

export const GUEST_AI_GLOBAL_DAY_RATE_ACTION = "guest_ai_spend_day";

export const GUEST_AI_GLOBAL_SUBJECT_KEY = "global:guest_ai";

/** Guest upload: IP limit / hodina. */
export const GUEST_UPLOAD_IP_LIMIT_PER_HOUR = 30;

/** Guest upload: visitor limit / hodina. */
export const GUEST_UPLOAD_VISITOR_LIMIT_PER_HOUR = 20;

/** Soft práh — odtud upload chce Turnstile (musí být ≤ visitor hard). */
export const GUEST_UPLOAD_SOFT_LIMIT_PER_HOUR = 10;

export const GUEST_UPLOAD_RATE_ACTION = "guest_upload";

export const GUEST_STAGING_PREFIX = "guest";

export const GUEST_VISITOR_COOKIE = "guest_moderation_id";

export const GUEST_LISTING_DRAFT_STORAGE_KEY = "zapikolou:guest_listing_draft:v1";

/** Koncept musí přežít e-mailové ověření v nové kartě, ale ne dlouhodobě. */
export const GUEST_LISTING_DRAFT_MAX_AGE_MS = 24 * 60 * 60 * 1000;

/** Po pádu requestu lze stejný publishRequestId bezpečně převzít znovu. */
export const GUEST_PUBLISH_LOCK_TIMEOUT_MS = 2 * 60 * 1000;

export const GUEST_LISTING_RESUME_QUERY = "resume";

export { resolveTurnstileSiteKey } from "@/config/turnstile";
