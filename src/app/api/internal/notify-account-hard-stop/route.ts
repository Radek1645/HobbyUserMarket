import { notifyAccountHardStop } from "@/lib/email/notify-account-hard-stop";
import type { AccountBlacklistSource } from "@/config/account-blacklist";
import { NextResponse } from "next/server";

type Body = {
  email?: string;
  source?: AccountBlacklistSource;
  reason?: string;
  userId?: string | null;
};

/**
 * Interní webhook pro Edge Function po auto hard stopu.
 * Auth: Authorization: Bearer CRON_SECRET (stejně jako crony).
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const source = body.source;
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";

  if (!email || (source !== "automatic" && source !== "manual") || !reason) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const sent = await notifyAccountHardStop({
    email,
    source,
    reason,
    userId: body.userId ?? null,
  });

  return NextResponse.json({ ok: true, sent });
}
