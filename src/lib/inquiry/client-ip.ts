const MAX_IP_LENGTH = 45;

/** IP klienta z reverse proxy (Vercel). Fallback „unknown“ pro lokální dev. */
export function getClientIpAddress(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) {
      return first.slice(0, MAX_IP_LENGTH);
    }
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) {
    return realIp.slice(0, MAX_IP_LENGTH);
  }

  return "unknown";
}
