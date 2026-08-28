import {
  MAPY_RGEOCODE_RATE_ACTION,
  MAPY_RGEOCODE_RATE_LIMIT_PER_HOUR,
  MAPY_RATE_LIMIT_ERROR,
  MAPY_SERVICE_UNAVAILABLE_ERROR,
  MAPY_SUGGEST_RATE_ACTION,
  MAPY_SUGGEST_RATE_LIMIT_PER_HOUR,
} from "@/config/mapy";
import { getClientIpAddress } from "@/lib/inquiry/client-ip";
import { createAdminClient } from "@/lib/supabase/admin";
import { createHash } from "node:crypto";

export type MapyRateAction =
  | typeof MAPY_SUGGEST_RATE_ACTION
  | typeof MAPY_RGEOCODE_RATE_ACTION;

export type MapyRateLimitResult =
  | { ok: true }
  | { ok: false; status: 429 | 503; error: string };

function currentHourWindowStart(): string {
  const now = new Date();
  now.setMinutes(0, 0, 0);
  return now.toISOString();
}

function hashIpSubject(ipAddress: string): string {
  const salt = process.env.ANONYMOUS_RATE_LIMIT_SALT?.trim();
  if (!salt) {
    throw new Error("RATE_LIMIT_UNAVAILABLE");
  }
  const day = new Date().toISOString().slice(0, 10);
  return `ip:${createHash("sha256")
    .update(`${salt}:${day}:${ipAddress}`)
    .digest("hex")}`;
}

function limitForAction(action: MapyRateAction): number {
  return action === MAPY_SUGGEST_RATE_ACTION
    ? MAPY_SUGGEST_RATE_LIMIT_PER_HOUR
    : MAPY_RGEOCODE_RATE_LIMIT_PER_HOUR;
}

/**
 * Atomický hodinový strop přes `increment_anonymous_rate_limit`.
 * Fail-closed při chybějícím saltu / admin klientu / RPC.
 * Počítá i cache hity — cache na Vercelu není spolehlivá pojistka.
 */
export async function assertMapyRateLimit(
  request: Request,
  action: MapyRateAction,
): Promise<MapyRateLimitResult> {
  const admin = createAdminClient();
  if (!admin.ok) {
    console.error("mapy rate-limit admin:", admin.error);
    return { ok: false, status: 503, error: MAPY_SERVICE_UNAVAILABLE_ERROR };
  }

  let subjectKey: string;
  try {
    subjectKey = hashIpSubject(getClientIpAddress(request));
  } catch {
    console.error("mapy rate-limit: missing ANONYMOUS_RATE_LIMIT_SALT");
    return { ok: false, status: 503, error: MAPY_SERVICE_UNAVAILABLE_ERROR };
  }

  const { data, error } = await admin.client.rpc(
    "increment_anonymous_rate_limit",
    {
      p_subject_key: subjectKey,
      p_action_type: action,
      p_window_start: currentHourWindowStart(),
    },
  );

  if (error || typeof data !== "number") {
    console.error("mapy rate-limit rpc:", error);
    return { ok: false, status: 503, error: MAPY_SERVICE_UNAVAILABLE_ERROR };
  }

  if (data > limitForAction(action)) {
    return { ok: false, status: 429, error: MAPY_RATE_LIMIT_ERROR };
  }

  return { ok: true };
}
