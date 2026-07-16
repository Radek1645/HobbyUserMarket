import { archiveExpiredPosts } from "@/lib/posts/archive-expired";
import { purgeListingsPastMaxLifetime } from "@/lib/posts/purge-past-lifetime";
import { NextResponse } from "next/server";

/**
 * Denní cron — archivace expirovaných inzerátů + soft-delete po max. lifetime.
 * Vercel Cron posílá Authorization: Bearer CRON_SECRET.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const archived = await archiveExpiredPosts();
  const purged = await purgeListingsPastMaxLifetime();

  return NextResponse.json({ ok: true, archived, purged });
}
