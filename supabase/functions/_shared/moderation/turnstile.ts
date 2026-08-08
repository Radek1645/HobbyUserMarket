/**
 * Cloudflare Turnstile server verify (Edge).
 * Secret: TURNSTILE_SECRET_KEY v Supabase Edge secrets.
 */
export async function verifyTurnstileToken(params: {
  token: string;
  ipAddress?: string | null;
}): Promise<boolean> {
  const secret = Deno.env.get("TURNSTILE_SECRET_KEY")?.trim();
  if (!secret) {
    console.error("turnstile: missing TURNSTILE_SECRET_KEY");
    return false;
  }

  const token = params.token.trim();
  if (!token) {
    return false;
  }

  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", token);
  if (params.ipAddress) {
    body.set("remoteip", params.ipAddress);
  }

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body,
      },
    );
    if (!response.ok) {
      console.error("turnstile: http", response.status);
      return false;
    }
    const payload = (await response.json()) as { success?: boolean };
    return payload.success === true;
  } catch (error) {
    console.error("turnstile: verify failed", error);
    return false;
  }
}
