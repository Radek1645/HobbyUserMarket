import { NextResponse } from "next/server";
import { getClientIpAddress } from "@/lib/inquiry/client-ip";
import { isBotUserAgent } from "@/lib/listing-views/is-bot-user-agent";
import { assertListingViewRateLimit } from "@/lib/listing-views/rate-limit";
import {
  buildListingIpHash,
  buildListingViewerKey,
} from "@/lib/listing-views/viewer-key";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function resolveHashSecret(): string | null {
  const dedicated = process.env.LISTING_VIEW_HASH_SECRET?.trim();
  if (dedicated) return dedicated;
  const fallback = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return fallback || null;
}

/**
 * Beacon zobrazení detailu inzerátu.
 * Vždy 204 — klient nečeká na výsledek; chyby jen logujeme.
 */
export async function POST(request: Request) {
  const userAgent = request.headers.get("user-agent");
  if (isBotUserAgent(userAgent)) {
    return new NextResponse(null, { status: 204 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  const postId = Number((body as { postId?: unknown })?.postId);
  if (!Number.isInteger(postId) || postId < 1) {
    return new NextResponse(null, { status: 204 });
  }

  const secret = resolveHashSecret();
  if (!secret) {
    console.error("listing-view: missing hash secret");
    return new NextResponse(null, { status: 204 });
  }

  const adminResult = createAdminClient();
  if (!adminResult.ok) {
    console.error("listing-view admin:", adminResult.error);
    return new NextResponse(null, { status: 204 });
  }

  const ipAddress = getClientIpAddress(request);
  const viewerKey = buildListingViewerKey({
    ipAddress,
    userAgent,
    secret,
  });
  const ipHash = buildListingIpHash({ ipAddress, secret });

  const rateLimit = await assertListingViewRateLimit(
    adminResult.client,
    ipHash,
  );
  if (!rateLimit.ok) {
    return new NextResponse(null, { status: 204 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await adminResult.client.rpc("record_listing_view", {
    p_post_id: postId,
    p_viewer_key: viewerKey,
    p_ip_hash: ipHash,
    p_viewer_user_id: user?.id ?? null,
  });

  if (error) {
    console.error("record_listing_view:", error);
  }

  return new NextResponse(null, { status: 204 });
}
