import { IP_ANONYMIZE_AFTER_DAYS } from "@/config/ip-anonymization";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

/**
 * Denní cron — zkrácení IP v inquiry_events starších než N dní (GDPR §3.2).
 * Vercel Cron posílá Authorization: Bearer CRON_SECRET.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminResult = createAdminClient();
  if (!adminResult.ok) {
    return NextResponse.json({ error: adminResult.error }, { status: 500 });
  }

  const { data, error } = await adminResult.client.rpc(
    "anonymize_old_inquiry_ips",
    { p_after_days: IP_ANONYMIZE_AFTER_DAYS },
  );

  if (error) {
    console.error("anonymize_old_inquiry_ips:", error);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    anonymized: typeof data === "number" ? data : 0,
  });
}
