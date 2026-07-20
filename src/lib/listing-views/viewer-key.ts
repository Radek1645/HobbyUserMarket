import { createHash } from "node:crypto";

const HASH_HEX_LENGTH = 64;

function sha256Hex(material: string): string {
  return createHash("sha256").update(material).digest("hex").slice(0, HASH_HEX_LENGTH);
}

/**
 * Pseudonymní klíč prohlížeče pro dedup zobrazení — bez raw IP v DB.
 */
export function buildListingViewerKey(params: {
  ipAddress: string;
  userAgent: string | null;
  secret: string;
}): string {
  const ua = (params.userAgent ?? "").slice(0, 200);
  return sha256Hex(`${params.ipAddress}\n${ua}\n${params.secret}`);
}

/** Hash IP pro rate limit (ne raw IP). */
export function buildListingIpHash(params: {
  ipAddress: string;
  secret: string;
}): string {
  return sha256Hex(`ip:${params.ipAddress}\n${params.secret}`);
}
