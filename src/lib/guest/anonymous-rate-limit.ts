import {
  GUEST_UPLOAD_IP_LIMIT_PER_HOUR,
  GUEST_UPLOAD_RATE_ACTION,
  GUEST_UPLOAD_VISITOR_LIMIT_PER_HOUR,
} from "@/config/guest-listing";
import { createAdminClient } from "@/lib/supabase/admin";
import { createHash } from "node:crypto";

function currentHourWindowStart(): string {
  const now = new Date();
  now.setMinutes(0, 0, 0);
  return now.toISOString();
}

function hashSubject(kind: "ip" | "visitor", raw: string): string {
  const salt = process.env.ANONYMOUS_RATE_LIMIT_SALT?.trim();
  if (!salt) {
    throw new Error("RATE_LIMIT_UNAVAILABLE");
  }
  const day = new Date().toISOString().slice(0, 10);
  return `${kind}:${createHash("sha256")
    .update(`${salt}:${day}:${raw}`)
    .digest("hex")}`;
}

/**
 * Atomický IP + visitor limit pro guest upload.
 * Fail closed při chybějícím saltu / DB.
 */
export async function assertGuestUploadRateLimit(params: {
  ipAddress: string;
  visitorId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createAdminClient();
  if (!admin.ok) {
    return { ok: false, error: "Nahrávání teď není dostupné. Zkuste to za chvíli." };
  }

  let ipKey: string;
  let visitorKey: string;
  try {
    ipKey = hashSubject("ip", params.ipAddress);
    visitorKey = hashSubject("visitor", params.visitorId);
  } catch {
    console.error("guest upload rate-limit: missing ANONYMOUS_RATE_LIMIT_SALT");
    return { ok: false, error: "Nahrávání teď není dostupné. Zkuste to za chvíli." };
  }

  const windowStart = currentHourWindowStart();
  const { data, error } = await admin.client.rpc(
    "consume_anonymous_rate_limit_pair",
    {
      p_ip_key: ipKey,
      p_visitor_key: visitorKey,
      p_action_type: GUEST_UPLOAD_RATE_ACTION,
      p_window_start: windowStart,
      p_soft_limit: GUEST_UPLOAD_VISITOR_LIMIT_PER_HOUR,
      p_ip_hard_limit: GUEST_UPLOAD_IP_LIMIT_PER_HOUR,
      p_visitor_hard_limit: GUEST_UPLOAD_VISITOR_LIMIT_PER_HOUR,
      p_captcha_verified: true,
    },
  );
  const row = Array.isArray(data) ? data[0] : data;

  if (
    error ||
    typeof row?.ip_count !== "number" ||
    typeof row?.visitor_count !== "number" ||
    typeof row?.allowed !== "boolean"
  ) {
    console.error("guest upload rate-limit rpc:", error);
    return { ok: false, error: "Nahrávání teď není dostupné. Zkuste to za chvíli." };
  }

  if (!row.allowed) {
    return {
      ok: false,
      error:
        "Dosáhli jste limitu nahrávání fotek. Zkuste to v následující hodině, nebo se přihlaste.",
    };
  }

  return { ok: true };
}
