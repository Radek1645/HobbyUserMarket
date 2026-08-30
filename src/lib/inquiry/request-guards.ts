/**
 * Cross-site abuse guard pro POST /api/inquiry (SEC-M02 / GO-6).
 * Content-Type: application/json zabije prostý HTML form POST.
 * Origin allowlist chrání prohlížeč na cizí doméně — ne curl.
 */

import {
  hostnameFromOriginOrReferer,
  parseMediaType,
  resolveAllowedHostnames,
} from "@/lib/security/allowed-origins";
import {
  INQUIRY_FORBIDDEN_ORIGIN_ERROR,
  INQUIRY_UNSUPPORTED_MEDIA_TYPE_ERROR,
} from "@/lib/inquiry/api-errors";

export type InquiryRequestGuardResult =
  | { ok: true }
  | { ok: false; status: 403 | 415; error: string };

export function assertInquiryJsonContentType(
  request: Request,
): InquiryRequestGuardResult {
  const mediaType = parseMediaType(request.headers.get("content-type"));
  if (mediaType !== "application/json") {
    return {
      ok: false,
      status: 415,
      error: INQUIRY_UNSUPPORTED_MEDIA_TYPE_ERROR,
    };
  }
  return { ok: true };
}

export function assertInquiryAllowedOrigin(
  request: Request,
): InquiryRequestGuardResult {
  const allowed = resolveAllowedHostnames();
  if (!allowed) {
    return { ok: true };
  }

  const hostname = hostnameFromOriginOrReferer(request);
  if (!hostname || !allowed.has(hostname)) {
    return {
      ok: false,
      status: 403,
      error: INQUIRY_FORBIDDEN_ORIGIN_ERROR,
    };
  }

  return { ok: true };
}
