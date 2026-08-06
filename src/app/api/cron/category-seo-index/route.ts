import { syncCategorySeoIndexStatuses } from "@/lib/seo/sync-category-seo-index";
import { NextResponse } from "next/server";

/**
 * Denní cron — listing_count + hystereze index_status u category_seo_pages.
 * Vercel Cron: Authorization Bearer CRON_SECRET.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await syncCategorySeoIndexStatuses();

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error ?? "sync failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    updated: result.updated,
    pages: result.pages,
  });
}
