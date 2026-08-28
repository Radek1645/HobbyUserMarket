import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";
import {
  GUEST_AI_GLOBAL_DAY_RATE_ACTION,
  GUEST_AI_GLOBAL_LIMIT_PER_DAY,
  GUEST_AI_GLOBAL_LIMIT_PER_HOUR,
  GUEST_AI_GLOBAL_RATE_ACTION,
  GUEST_AI_GLOBAL_SUBJECT_KEY,
  GUEST_AI_IP_LIMIT_PER_HOUR,
  GUEST_AI_SOFT_LIMIT_PER_HOUR,
  GUEST_AI_VISITOR_LIMIT_PER_HOUR,
  GUEST_SUGGEST_IP_LIMIT_PER_HOUR,
  GUEST_SUGGEST_SOFT_LIMIT_PER_HOUR,
  GUEST_SUGGEST_VISITOR_LIMIT_PER_HOUR,
} from "./guest-rate-limit-config.ts";

const AI_RATE_LIMIT_PER_HOUR = 20;
/** Prefill z fotek — oddělený budget od publish moderace. */
const SUGGEST_FROM_PHOTOS_RATE_LIMIT_PER_HOUR = 20;

function currentHourWindowStart(): string {
  const now = new Date();
  now.setMinutes(0, 0, 0);
  return now.toISOString();
}

function createAdminClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("rate-limit: missing Supabase env");
    throw new Error("RATE_LIMIT_UNAVAILABLE");
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

/**
 * Fail closed: chybějící config nebo DB chyba = odmítnout request (M6).
 *
 * SEC-H03: přihlášený uživatel dřív mohl číst/psát vlastní `rate_limits`
 * přímo přes Supabase API (grant + RLS „own row“) a limit obejít nebo
 * paralelizovat select+update. `rate_limits` je teď bez grantů/policy pro
 * anon/authenticated; inkrementace jde přes atomický `increment_rate_limit`
 * (INSERT … ON CONFLICT), takže nehrozí race mezi čtením a zápisem počtu.
 */
export async function assertAiModerationRateLimit(
  userId: string,
): Promise<void> {
  const admin = createAdminClient();

  const { data: count, error } = await admin.rpc("increment_rate_limit", {
    p_user_id: userId,
    p_action_type: "ai_check",
    p_window_start: currentHourWindowStart(),
  });

  if (error || typeof count !== "number") {
    console.error("rate-limit rpc:", error);
    throw new Error("RATE_LIMIT_UNAVAILABLE");
  }

  if (count > AI_RATE_LIMIT_PER_HOUR) {
    throw new Error("RATE_LIMIT");
  }
}

/** Rate limit pro Edge `suggest-listing-from-photos` (action `suggest_from_photos`). */
export async function assertSuggestFromPhotosRateLimit(
  userId: string,
): Promise<void> {
  const admin = createAdminClient();

  const { data: count, error } = await admin.rpc("increment_rate_limit", {
    p_user_id: userId,
    p_action_type: "suggest_from_photos",
    p_window_start: currentHourWindowStart(),
  });

  if (error || typeof count !== "number") {
    console.error("suggest rate-limit rpc:", error);
    throw new Error("RATE_LIMIT_UNAVAILABLE");
  }

  if (count > SUGGEST_FROM_PHOTOS_RATE_LIMIT_PER_HOUR) {
    throw new Error("RATE_LIMIT");
  }
}

function currentUtcDayWindowStart(): string {
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  return now.toISOString();
}

async function incrementAnonymousCount(
  admin: ReturnType<typeof createAdminClient>,
  subjectKey: string,
  actionType: string,
  windowStart: string,
): Promise<number> {
  const { data, error } = await admin.rpc("increment_anonymous_rate_limit", {
    p_subject_key: subjectKey,
    p_action_type: actionType,
    p_window_start: windowStart,
  });
  if (error || typeof data !== "number") {
    console.error("guest AI global rate-limit rpc:", error);
    throw new Error("RATE_LIMIT_UNAVAILABLE");
  }
  return data;
}

/**
 * Strop útraty guest AI napříč všemi návštěvníky (hodina + kalendářní den UTC).
 * Volat až po per-IP / visitor limitu, před Sightengine/Gemini.
 */
export async function assertGuestAiGlobalSpendLimit(): Promise<void> {
  const admin = createAdminClient();
  const hourCount = await incrementAnonymousCount(
    admin,
    GUEST_AI_GLOBAL_SUBJECT_KEY,
    GUEST_AI_GLOBAL_RATE_ACTION,
    currentHourWindowStart(),
  );
  if (hourCount > GUEST_AI_GLOBAL_LIMIT_PER_HOUR) {
    throw new Error("RATE_LIMIT_GLOBAL");
  }

  const dayCount = await incrementAnonymousCount(
    admin,
    GUEST_AI_GLOBAL_SUBJECT_KEY,
    GUEST_AI_GLOBAL_DAY_RATE_ACTION,
    currentUtcDayWindowStart(),
  );
  if (dayCount > GUEST_AI_GLOBAL_LIMIT_PER_DAY) {
    throw new Error("RATE_LIMIT_GLOBAL");
  }
}

async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/** Denní salt — raw IP se do DB neukládá. Bez env = fail closed. */
async function hashSubject(kind: "ip" | "visitor", raw: string): Promise<string> {
  const salt = Deno.env.get("ANONYMOUS_RATE_LIMIT_SALT")?.trim();
  if (!salt) {
    console.error("rate-limit: missing ANONYMOUS_RATE_LIMIT_SALT");
    throw new Error("RATE_LIMIT_UNAVAILABLE");
  }
  const day = new Date().toISOString().slice(0, 10);
  return `${kind}:${await sha256Hex(`${salt}:${day}:${raw}`)}`;
}

/** Ověří podpis visitor ID vytvořený Next serverem stejným tajným saltem. */
export async function verifyGuestVisitorToken(
  visitorId: string,
  token: string,
): Promise<boolean> {
  const salt = Deno.env.get("ANONYMOUS_RATE_LIMIT_SALT")?.trim();
  if (!salt || !token) return false;

  const expected = await sha256Hex(
    `${salt}:guest-visitor:${visitorId}`,
  );
  if (expected.length !== token.length) return false;

  let difference = 0;
  for (let index = 0; index < expected.length; index++) {
    difference |= expected.charCodeAt(index) ^ token.charCodeAt(index);
  }
  return difference === 0;
}

export type GuestRateLimitResult = {
  ipCount: number;
  visitorCount: number;
  /** Soft limit překročen — klient musí poslat Turnstile. */
  requiresCaptcha: boolean;
};

/**
 * Guest rate limit pro suggest-from-photos.
 * Oddělený action_type od guest_ai_preview (publish náhled).
 */
export async function assertGuestSuggestFromPhotosRateLimit(params: {
  ipAddress: string;
  visitorId: string;
  captchaVerified: boolean;
}): Promise<GuestRateLimitResult> {
  const admin = createAdminClient();
  const windowStart = currentHourWindowStart();
  const ipKey = await hashSubject("ip", params.ipAddress);
  const visitorKey = await hashSubject("visitor", params.visitorId);
  const actionType = "guest_suggest_from_photos";

  const { data, error } = await admin.rpc(
    "consume_anonymous_rate_limit_pair",
    {
      p_ip_key: ipKey,
      p_visitor_key: visitorKey,
      p_action_type: actionType,
      p_window_start: windowStart,
      p_soft_limit: GUEST_SUGGEST_SOFT_LIMIT_PER_HOUR,
      p_ip_hard_limit: GUEST_SUGGEST_IP_LIMIT_PER_HOUR,
      p_visitor_hard_limit: GUEST_SUGGEST_VISITOR_LIMIT_PER_HOUR,
      p_captcha_verified: params.captchaVerified,
    },
  );

  const row = Array.isArray(data) ? data[0] : data;
  if (
    error ||
    typeof row?.ip_count !== "number" ||
    typeof row?.visitor_count !== "number" ||
    typeof row?.requires_captcha !== "boolean" ||
    typeof row?.allowed !== "boolean"
  ) {
    console.error("guest suggest rate-limit pair rpc:", error);
    throw new Error("RATE_LIMIT_UNAVAILABLE");
  }

  if (
    row.ip_count >= GUEST_SUGGEST_IP_LIMIT_PER_HOUR ||
    row.visitor_count >= GUEST_SUGGEST_VISITOR_LIMIT_PER_HOUR
  ) {
    throw new Error("RATE_LIMIT");
  }

  return {
    ipCount: row.ip_count,
    visitorCount: row.visitor_count,
    requiresCaptcha: row.requires_captcha,
  };
}

/**
 * Guest preview rate limit: IP (primární) + visitor id (sekundární).
 * Captcha se ověří *před* inkrementem (neúspěšná captcha nespálí budget).
 * RPC zamyká oba řádky atomicky, takže paralelní requesty limit nepřekročí.
 */
export async function assertGuestAiModerationRateLimit(params: {
  ipAddress: string;
  visitorId: string;
  /** True = Turnstile už ověřen pro tento request. */
  captchaVerified: boolean;
}): Promise<GuestRateLimitResult> {
  const admin = createAdminClient();
  const windowStart = currentHourWindowStart();
  const ipKey = await hashSubject("ip", params.ipAddress);
  const visitorKey = await hashSubject("visitor", params.visitorId);
  const actionType = "guest_ai_preview";

  const { data, error } = await admin.rpc(
    "consume_anonymous_rate_limit_pair",
    {
      p_ip_key: ipKey,
      p_visitor_key: visitorKey,
      p_action_type: actionType,
      p_window_start: windowStart,
      p_soft_limit: GUEST_AI_SOFT_LIMIT_PER_HOUR,
      p_ip_hard_limit: GUEST_AI_IP_LIMIT_PER_HOUR,
      p_visitor_hard_limit: GUEST_AI_VISITOR_LIMIT_PER_HOUR,
      p_captcha_verified: params.captchaVerified,
    },
  );

  const row = Array.isArray(data) ? data[0] : data;
  if (
    error ||
    typeof row?.ip_count !== "number" ||
    typeof row?.visitor_count !== "number" ||
    typeof row?.requires_captcha !== "boolean" ||
    typeof row?.allowed !== "boolean"
  ) {
    console.error("anonymous rate-limit pair rpc:", error);
    throw new Error("RATE_LIMIT_UNAVAILABLE");
  }

  if (
    row.ip_count >= GUEST_AI_IP_LIMIT_PER_HOUR ||
    row.visitor_count >= GUEST_AI_VISITOR_LIMIT_PER_HOUR
  ) {
    throw new Error("RATE_LIMIT");
  }

  return {
    ipCount: row.ip_count,
    visitorCount: row.visitor_count,
    requiresCaptcha: row.requires_captcha,
  };
}
