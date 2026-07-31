import type { EmailOtpType } from "@supabase/supabase-js";

const EMAIL_OTP_TYPES = new Set<string>([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]);

/** Validuje `type` z ověřovacího odkazu (šablona /auth/potvrdit). */
export function parseEmailOtpType(raw: string | null | undefined): EmailOtpType | null {
  if (!raw || !EMAIL_OTP_TYPES.has(raw)) {
    return null;
  }
  return raw as EmailOtpType;
}
