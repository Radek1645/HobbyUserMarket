import { archiveExpiredPosts } from "@/lib/posts/archive-expired";
import { NextResponse } from "next/server";

/**
 * Denní cron — archivace expirovaných inzerátů (PRD §9.5).
 * Vercel Cron posílá Authorization: Bearer CRON_SECRET.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const archived = await archiveExpiredPosts();

  return NextResponse.json({ ok: true, archived });
}
