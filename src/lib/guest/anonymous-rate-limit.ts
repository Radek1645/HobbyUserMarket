import {
  GUEST_UPLOAD_IP_LIMIT_PER_HOUR,
  GUEST_UPLOAD_RATE_ACTION,
  GUEST_UPLOAD_SOFT_LIMIT_PER_HOUR,
  GUEST_UPLOAD_VISITOR_LIMIT_PER_HOUR,
  GUEST_VISITOR_MINT_LIMIT_PER_HOUR,
  GUEST_VISITOR_MINT_RATE_ACTION,
} from "@/config/guest-listing";
import {
  currentHourlyRateLimitWindowStart,
  hashAnonymousRateLimitSubject,
} from "@/lib/security/anonymous-rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

const MINT_UNAVAILABLE =
  "Návštěvnickou relaci teď nelze připravit. Zkuste to za chvíli.";
const MINT_LIMIT =
  "Příliš mnoho pokusů z této sítě. Zkuste to v následující hodině, nebo se přihlaste.";
const UPLOAD_UNAVAILABLE =
  "Nahrávání teď není dostupné. Zkuste to za chvíli.";
const UPLOAD_LIMIT =
  "Dosáhli jste limitu nahrávání fotek. Zkuste to v následující hodině, nebo se přihlaste.";
const UPLOAD_CAPTCHA =
  "Potvrďte, že nejste robot, a zkuste nahrát fotky znovu.";

/**
 * Limit na vytvoření nového guest visitor ID (ne na reuse cookie).
 */
export async function assertGuestVisitorMintRateLimit(
  ipAddress: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createAdminClient();
  if (!admin.ok) {
    return { ok: false, error: MINT_UNAVAILABLE };
  }

  let subjectKey: string;
  try {
    subjectKey = hashAnonymousRateLimitSubject("ip", ipAddress);
  } catch {
    console.error("guest visitor mint: missing ANONYMOUS_RATE_LIMIT_SALT");
    return { ok: false, error: MINT_UNAVAILABLE };
  }

  const { data, error } = await admin.client.rpc(
    "increment_anonymous_rate_limit",
    {
      p_subject_key: subjectKey,
      p_action_type: GUEST_VISITOR_MINT_RATE_ACTION,
      p_window_start: currentHourlyRateLimitWindowStart(),
    },
  );

  if (error || typeof data !== "number") {
    console.error("guest visitor mint rpc:", error);
    return { ok: false, error: MINT_UNAVAILABLE };
  }

  if (data > GUEST_VISITOR_MINT_LIMIT_PER_HOUR) {
    return { ok: false, error: MINT_LIMIT };
  }

  return { ok: true };
}

/**
 * Atomický IP + visitor limit pro guest upload.
 * Fail closed při chybějícím saltu / DB. Captcha až po soft limitu.
 */
export async function assertGuestUploadRateLimit(params: {
  ipAddress: string;
  visitorId: string;
  captchaVerified: boolean;
}): Promise<
  { ok: true } | { ok: false; error: string; captchaRequired?: boolean }
> {
  const admin = createAdminClient();
  if (!admin.ok) {
    return { ok: false, error: UPLOAD_UNAVAILABLE };
  }

  let ipKey: string;
  let visitorKey: string;
  try {
    ipKey = hashAnonymousRateLimitSubject("ip", params.ipAddress);
    visitorKey = hashAnonymousRateLimitSubject("visitor", params.visitorId);
  } catch {
    console.error("guest upload rate-limit: missing ANONYMOUS_RATE_LIMIT_SALT");
    return { ok: false, error: UPLOAD_UNAVAILABLE };
  }

  const windowStart = currentHourlyRateLimitWindowStart();
  const { data, error } = await admin.client.rpc(
    "consume_anonymous_rate_limit_pair",
    {
      p_ip_key: ipKey,
      p_visitor_key: visitorKey,
      p_action_type: GUEST_UPLOAD_RATE_ACTION,
      p_window_start: windowStart,
      p_soft_limit: GUEST_UPLOAD_SOFT_LIMIT_PER_HOUR,
      p_ip_hard_limit: GUEST_UPLOAD_IP_LIMIT_PER_HOUR,
      p_visitor_hard_limit: GUEST_UPLOAD_VISITOR_LIMIT_PER_HOUR,
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
    console.error("guest upload rate-limit rpc:", error);
    return { ok: false, error: UPLOAD_UNAVAILABLE };
  }

  if (row.allowed) {
    return { ok: true };
  }

  if (row.requires_captcha && !params.captchaVerified) {
    return {
      ok: false,
      error: UPLOAD_CAPTCHA,
      captchaRequired: true,
    };
  }

  return { ok: false, error: UPLOAD_LIMIT };
}
