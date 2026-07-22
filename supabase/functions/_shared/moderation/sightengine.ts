/**
 * Sightengine nudity gate — před Gemini.
 * Model nudity-2.1: mapujeme sexual_activity/sexual_display ≈ raw, erotica ≈ partial.
 */
import {
  NSFW_NUDITY_PARTIAL_THRESHOLD,
  NSFW_NUDITY_RAW_THRESHOLD,
  SIGHTENGINE_FETCH_TIMEOUT_MS,
} from "./constants.ts";
import { fetchWithTimeout, isFetchTimeoutError } from "./fetch-with-timeout.ts";

const SIGHTENGINE_CHECK_URL = "https://api.sightengine.com/1.0/check.json";
const SIGHTENGINE_MODEL = "nudity-2.1";

export type ImageNudityCheckResult =
  | {
      rejected: false;
      /** Celé JSON tělo z Sightengine API. */
      response: unknown;
    }
  | {
      rejected: true;
      reason: "nudity_raw" | "nudity_partial";
      response: unknown;
    };

export class SightengineUnavailableError extends Error {
  constructor(message = "SIGHTENGINE_UNAVAILABLE") {
    super(message);
    this.name = "SightengineUnavailableError";
  }
}

function stripBase64Payload(imageBase64: string): string {
  const trimmed = imageBase64.trim();
  const comma = trimmed.indexOf(",");
  if (trimmed.startsWith("data:") && comma !== -1) {
    return trimmed.slice(comma + 1);
  }
  return trimmed;
}

function decodeBase64ToBytes(imageBase64: string): Uint8Array {
  const payload = stripBase64Payload(imageBase64);
  const binary = atob(payload);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function asScore(value: unknown): number {
  return typeof value === "number" && !Number.isNaN(value) ? value : 0;
}

function evaluateNudityScores(nudity: Record<string, unknown>): {
  rejected: boolean;
  reason?: "nudity_raw" | "nudity_partial";
} {
  // Legacy raw/partial (starší model), pokud API vrátí.
  const legacyRaw = asScore(nudity.raw);
  const legacyPartial = asScore(nudity.partial);
  if (legacyRaw > NSFW_NUDITY_RAW_THRESHOLD) {
    return { rejected: true, reason: "nudity_raw" };
  }
  if (legacyPartial > NSFW_NUDITY_PARTIAL_THRESHOLD) {
    return { rejected: true, reason: "nudity_partial" };
  }

  // nudity-2.1
  const sexualActivity = asScore(nudity.sexual_activity);
  const sexualDisplay = asScore(nudity.sexual_display);
  const erotica = asScore(nudity.erotica);

  if (
    sexualActivity > NSFW_NUDITY_RAW_THRESHOLD ||
    sexualDisplay > NSFW_NUDITY_RAW_THRESHOLD
  ) {
    return { rejected: true, reason: "nudity_raw" };
  }
  if (erotica > NSFW_NUDITY_PARTIAL_THRESHOLD) {
    return { rejected: true, reason: "nudity_partial" };
  }

  return { rejected: false };
}

/** Zkontroluje jednu fotku (JPEG base64 z prepare-moderation-images). */
export async function checkImageNudity(
  imageBase64: string,
): Promise<ImageNudityCheckResult> {
  const apiUser = Deno.env.get("SIGHTENGINE_API_USER")?.trim();
  const apiSecret = Deno.env.get("SIGHTENGINE_API_SECRET")?.trim();

  if (!apiUser || !apiSecret) {
    throw new SightengineUnavailableError("SIGHTENGINE_KEYS_MISSING");
  }

  let bytes: Uint8Array;
  try {
    bytes = decodeBase64ToBytes(imageBase64);
  } catch {
    throw new SightengineUnavailableError("SIGHTENGINE_IMAGE_DECODE_FAILED");
  }

  const form = new FormData();
  const mediaBytes = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  );
  form.append(
    "media",
    new Blob([mediaBytes], { type: "image/jpeg" }),
    "moderation.jpg",
  );
  form.append("models", SIGHTENGINE_MODEL);
  form.append("api_user", apiUser);
  form.append("api_secret", apiSecret);

  let response: Response;
  try {
    response = await fetchWithTimeout(
      SIGHTENGINE_CHECK_URL,
      { method: "POST", body: form },
      SIGHTENGINE_FETCH_TIMEOUT_MS,
    );
  } catch (error) {
    if (isFetchTimeoutError(error)) {
      throw new SightengineUnavailableError("SIGHTENGINE_TIMEOUT");
    }
    console.error("sightengine fetch:", error);
    throw new SightengineUnavailableError("SIGHTENGINE_FETCH_FAILED");
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch (error) {
    console.error("sightengine json:", error);
    throw new SightengineUnavailableError("SIGHTENGINE_INVALID_JSON");
  }

  if (!response.ok) {
    console.error(
      "sightengine http:",
      response.status,
      JSON.stringify(payload).slice(0, 400),
    );
    throw new SightengineUnavailableError(`SIGHTENGINE_HTTP_${response.status}`);
  }

  const body = payload as {
    status?: string;
    nudity?: Record<string, unknown>;
    error?: { message?: string };
  };

  if (body.status !== "success" || !body.nudity) {
    console.error("sightengine status:", JSON.stringify(payload).slice(0, 400));
    throw new SightengineUnavailableError("SIGHTENGINE_STATUS_ERROR");
  }

  const decision = evaluateNudityScores(body.nudity);
  if (decision.rejected && decision.reason) {
    return { rejected: true, reason: decision.reason, response: payload };
  }
  return { rejected: false, response: payload };
}
