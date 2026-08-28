const MAX_IP_LENGTH = 45;

/** Fallback, když proxy hlavičky chybí (lokální `next dev`). */
export const UNKNOWN_CLIENT_IP = "unknown";

function firstNonEmpty(value: string): string | null {
  const part = value.split(",")[0]?.trim();
  return part || null;
}

/** Poslední prvek XFF — u řetězce proxy ten, který přidal náš okraj. */
function lastNonEmpty(value: string): string | null {
  const parts = value.split(",");
  for (let index = parts.length - 1; index >= 0; index -= 1) {
    const part = parts[index]?.trim();
    if (part) return part;
  }
  return null;
}

function clipIp(value: string): string {
  return value.slice(0, MAX_IP_LENGTH);
}

/**
 * IP pro rate limity. Cloudflare je u nás šedý cloud — `cf-connecting-ip` se nepoužívá.
 *
 * Pořadí: `x-vercel-forwarded-for` (platforma) → `x-real-ip` → `x-forwarded-for` **zprava**
 * (klient umí předřadit falešnou IP vlevo).
 */
export function readClientIpFromHeaders(headers: Headers): string {
  const vercel = headers.get("x-vercel-forwarded-for")?.trim();
  if (vercel) {
    const ip = firstNonEmpty(vercel);
    if (ip) return clipIp(ip);
  }

  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) {
    const ip = firstNonEmpty(realIp);
    if (ip) return clipIp(ip);
  }

  const forwarded = headers.get("x-forwarded-for")?.trim();
  if (forwarded) {
    const ip = lastNonEmpty(forwarded);
    if (ip) return clipIp(ip);
  }

  return UNKNOWN_CLIENT_IP;
}

export function getClientIpAddress(request: Request): string {
  return readClientIpFromHeaders(request.headers);
}
