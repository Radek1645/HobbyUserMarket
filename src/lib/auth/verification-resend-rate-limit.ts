import {
  VERIFICATION_RESEND_EMAIL_LIMIT_PER_HOUR,
  VERIFICATION_RESEND_IP_LIMIT_PER_HOUR,
  VERIFICATION_RESEND_RATE_ACTION,
} from "@/config/app";
import {
  currentHourlyRateLimitWindowStart,
  hashAnonymousRateLimitSubject,
} from "@/lib/security/anonymous-rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

const VERIFICATION_RESEND_LIMIT_ERROR =
  "Ověřovací e-mail už byl odeslán příliš mnohokrát. Zkuste to později.";
const VERIFICATION_RESEND_UNAVAILABLE_ERROR =
  "Ověřovací e-mail teď nelze odeslat. Zkuste to později.";

/**
 * Atomický hodinový limit resendu podle IP i cílového e-mailu.
 * CAPTCHA už byla ověřena, ale sama nebrání ručnímu e-mail bombingu.
 */
export async function assertVerificationResendRateLimit(params: {
  ipAddress: string;
  email: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createAdminClient();
  if (!admin.ok) {
    console.error("verification resend rate-limit admin:", admin.error);
    return { ok: false, error: VERIFICATION_RESEND_UNAVAILABLE_ERROR };
  }

  let ipKey: string;
  let emailKey: string;
  try {
    ipKey = hashAnonymousRateLimitSubject("ip", params.ipAddress);
    emailKey = hashAnonymousRateLimitSubject("email", params.email);
  } catch {
    console.error(
      "verification resend rate-limit: missing ANONYMOUS_RATE_LIMIT_SALT",
    );
    return { ok: false, error: VERIFICATION_RESEND_UNAVAILABLE_ERROR };
  }

  const { data, error } = await admin.client.rpc(
    "consume_anonymous_rate_limit_pair",
    {
      p_ip_key: ipKey,
      p_visitor_key: emailKey,
      p_action_type: VERIFICATION_RESEND_RATE_ACTION,
      p_window_start: currentHourlyRateLimitWindowStart(),
      p_soft_limit: 0,
      p_ip_hard_limit: VERIFICATION_RESEND_IP_LIMIT_PER_HOUR,
      p_visitor_hard_limit: VERIFICATION_RESEND_EMAIL_LIMIT_PER_HOUR,
      p_captcha_verified: true,
    },
  );
  const row = Array.isArray(data) ? data[0] : data;

  if (error || typeof row?.allowed !== "boolean") {
    console.error("verification resend rate-limit rpc:", error);
    return { ok: false, error: VERIFICATION_RESEND_UNAVAILABLE_ERROR };
  }

  if (!row.allowed) {
    return { ok: false, error: VERIFICATION_RESEND_LIMIT_ERROR };
  }

  return { ok: true };
}
