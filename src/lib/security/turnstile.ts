import {
  TURNSTILE_TOKEN_MAX_LENGTH,
  TURNSTILE_VERIFY_TIMEOUT_MS,
  TURNSTILE_FAILED_ERROR,
  TURNSTILE_REQUIRED_ERROR,
  TURNSTILE_UNAVAILABLE_ERROR,
  type TurnstileAction,
} from "@/config/turnstile";
import {
  normalizeHostname,
  resolveAllowedHostnames,
} from "@/lib/security/allowed-origins";
import { UNKNOWN_CLIENT_IP } from "@/lib/security/client-ip";

type TurnstileVerificationResult =
  | { ok: true }
  | { ok: false; reason: "invalid" | "unavailable" };

type TurnstileSiteverifyPayload = {
  success?: boolean;
  hostname?: string;
  action?: string;
  "error-codes"?: string[];
};

async function verifyTurnstileTokenDetailed(params: {
  token: string;
  ipAddress?: string | null;
  expectedAction?: TurnstileAction;
}): Promise<TurnstileVerificationResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) {
    console.error("turnstile: missing TURNSTILE_SECRET_KEY");
    return { ok: false, reason: "unavailable" };
  }

  const token = params.token.trim();
  if (!token || token.length > TURNSTILE_TOKEN_MAX_LENGTH) {
    return { ok: false, reason: "invalid" };
  }

  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", token);
  if (params.ipAddress && params.ipAddress !== UNKNOWN_CLIENT_IP) {
    body.set("remoteip", params.ipAddress);
  }

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body,
        signal: AbortSignal.timeout(TURNSTILE_VERIFY_TIMEOUT_MS),
      },
    );
    if (!response.ok) {
      console.error("turnstile: siteverify http", response.status);
      return { ok: false, reason: "unavailable" };
    }

    const payload = (await response.json()) as TurnstileSiteverifyPayload;
    if (payload.success !== true) {
      console.warn("turnstile: rejected", payload["error-codes"] ?? []);
      return { ok: false, reason: "invalid" };
    }

    if (params.expectedAction && payload.action !== params.expectedAction) {
      console.warn("turnstile: action mismatch");
      return { ok: false, reason: "invalid" };
    }

    const expectedHostnames = resolveAllowedHostnames();
    const tokenHostname = normalizeHostname(payload.hostname);
    if (
      expectedHostnames &&
      (!tokenHostname || !expectedHostnames.has(tokenHostname))
    ) {
      console.warn("turnstile: hostname mismatch", {
        tokenHostname,
        allowed: [...expectedHostnames],
      });
      return { ok: false, reason: "invalid" };
    }

    return { ok: true };
  } catch (error) {
    console.error("turnstile verify:", error);
    return { ok: false, reason: "unavailable" };
  }
}

/**
 * Cloudflare Turnstile verify (Next.js server).
 * Secret: TURNSTILE_SECRET_KEY (server-only).
 */
export async function verifyTurnstileTokenServer(params: {
  token: string;
  ipAddress?: string | null;
}): Promise<boolean> {
  const result = await verifyTurnstileTokenDetailed(params);
  return result.ok;
}

export { readClientIpFromHeaders as readRequestIp } from "@/lib/security/client-ip";

export type TurnstileAssertResult =
  | { ok: true }
  | {
      ok: false;
      error: string;
      reason: "required" | "invalid" | "unavailable";
    };

/**
 * Povinná CAPTCHA (resend ověření, poptávka). Bez tokenu ani secretu se akce nespustí.
 */
export async function assertTurnstileToken(params: {
  token: string | null | undefined;
  ipAddress?: string | null;
  action: TurnstileAction;
}): Promise<TurnstileAssertResult> {
  const token = params.token?.trim() ?? "";
  if (!token) {
    return {
      ok: false,
      error: TURNSTILE_REQUIRED_ERROR,
      reason: "required",
    };
  }

  const result = await verifyTurnstileTokenDetailed({
    token,
    ipAddress: params.ipAddress,
    expectedAction: params.action,
  });
  if (!result.ok) {
    return result.reason === "unavailable"
      ? {
          ok: false,
          error: TURNSTILE_UNAVAILABLE_ERROR,
          reason: "unavailable",
        }
      : {
          ok: false,
          error: TURNSTILE_FAILED_ERROR,
          reason: "invalid",
        };
  }

  return { ok: true };
}
