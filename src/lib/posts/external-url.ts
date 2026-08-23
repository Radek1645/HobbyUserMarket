import { EXTERNAL_URL_MAX_LENGTH } from "@/config/app";
import {
  BLOCKED_ADULT_HOST_LABELS,
  BLOCKED_ADULT_TLDS,
  EXTERNAL_URL_FIELD_UI,
} from "@/config/listing-external-url";

const HTTPS_SCHEME = "https://";

export type ExternalUrlParseResult =
  | { ok: true; url: string | null }
  | { ok: false; error: string };

const IPV4_HOST_PATTERN = /^(\d{1,3}\.){3}\d{1,3}$/;

function stripCopyPasteWrappers(raw: string): string {
  let value = raw.trim();
  const wrapped =
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'")) ||
    (value.startsWith("<") && value.endsWith(">")) ||
    (value.startsWith("(") && value.endsWith(")"));
  if (wrapped) {
    value = value.slice(1, -1).trim();
  }
  return value.replace(/[.,;:!?)>\]]+$/u, "").trim();
}

function hostnameIsIpAddress(hostname: string): boolean {
  const host = hostname.replace(/^\[|\]$/g, "");
  return IPV4_HOST_PATTERN.test(host) || host.includes(":");
}

function hostnameLooksPublic(hostname: string): boolean {
  const host = hostname.replace(/\.$/, "").toLowerCase();
  if (!host || host === "localhost" || host.endsWith(".local")) {
    return false;
  }
  if (hostnameIsIpAddress(host)) {
    return false;
  }
  return host.includes(".") && /[a-z]/i.test(host);
}

function hostnameIsBlockedAdult(hostname: string): boolean {
  const labels = hostname
    .replace(/\.$/, "")
    .toLowerCase()
    .split(".")
    .filter(Boolean);
  if (labels.length === 0) {
    return false;
  }

  const tld = labels[labels.length - 1];
  if (BLOCKED_ADULT_TLDS.has(tld)) {
    return true;
  }

  return labels.some((label) => {
    if (BLOCKED_ADULT_HOST_LABELS.has(label)) {
      return true;
    }
    if (label === "sex" || label === "xxx") {
      return true;
    }
    return label.includes("porn") || label.includes("xxx");
  });
}

/**
 * Normalizuje volitelný odkaz u události (https, bez credentials).
 * Prázdný vstup = žádný odkaz. http:// se zvedne na https://.
 */
export function parseListingExternalUrl(raw: string): ExternalUrlParseResult {
  const trimmed = stripCopyPasteWrappers(raw);
  if (!trimmed) {
    return { ok: true, url: null };
  }

  if (/\s/.test(trimmed)) {
    return { ok: false, error: EXTERNAL_URL_FIELD_UI.noSpaces };
  }

  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed)
    ? trimmed
    : `${HTTPS_SCHEME}${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(withScheme);
  } catch {
    return { ok: false, error: EXTERNAL_URL_FIELD_UI.invalid };
  }

  if (parsed.protocol === "http:") {
    parsed.protocol = "https:";
  }

  if (parsed.protocol !== "https:") {
    return { ok: false, error: EXTERNAL_URL_FIELD_UI.httpsRequired };
  }

  if (parsed.username || parsed.password) {
    return { ok: false, error: EXTERNAL_URL_FIELD_UI.noCredentials };
  }

  if (hostnameIsIpAddress(parsed.hostname)) {
    return { ok: false, error: EXTERNAL_URL_FIELD_UI.noIp };
  }

  if (!hostnameLooksPublic(parsed.hostname)) {
    return { ok: false, error: EXTERNAL_URL_FIELD_UI.publicHost };
  }

  if (hostnameIsBlockedAdult(parsed.hostname)) {
    return { ok: false, error: EXTERNAL_URL_FIELD_UI.adultBlocked };
  }

  const href = parsed.toString();
  if (href.length > EXTERNAL_URL_MAX_LENGTH) {
    return {
      ok: false,
      error: EXTERNAL_URL_FIELD_UI.tooLong(EXTERNAL_URL_MAX_LENGTH),
    };
  }

  return { ok: true, url: href };
}

/** Label CTA na detailu podle známé domény. */
export function getExternalUrlDisplayLabel(url: string): string {
  let hostname = "";
  try {
    hostname = new URL(url).hostname.toLowerCase();
  } catch {
    return "Další informace online";
  }

  if (
    hostname === "facebook.com" ||
    hostname.endsWith(".facebook.com") ||
    hostname === "fb.com" ||
    hostname.endsWith(".fb.com") ||
    hostname === "fb.me"
  ) {
    return "Facebook";
  }

  if (hostname === "instagram.com" || hostname.endsWith(".instagram.com")) {
    return "Instagram";
  }

  return "Další informace online";
}
