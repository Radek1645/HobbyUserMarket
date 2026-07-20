import type {
  AdvertiserProfile,
  AdvertiserPublicProfile,
} from "@/lib/auth/advertiser-display";
import { createClient } from "@/lib/supabase/server";

function mapAdvertiserRow(
  row: Record<string, unknown>,
): AdvertiserProfile {
  return {
    nickname: String(row.nickname ?? ""),
    is_company: row.is_company === true,
    company_name:
      typeof row.company_name === "string" ? row.company_name : null,
    company_ico: typeof row.company_ico === "string" ? row.company_ico : null,
    lifetime_published_count: Number(row.lifetime_published_count ?? 0),
  };
}

export async function getAdvertiserProfile(
  userId: string,
): Promise<AdvertiserProfile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_advertiser_display", {
    p_user_id: userId,
  });

  if (error || !data || !Array.isArray(data) || data.length === 0) {
    return null;
  }

  return mapAdvertiserRow(data[0] as Record<string, unknown>);
}

export async function getAdvertiserPublicByNickname(
  nickname: string,
): Promise<AdvertiserPublicProfile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc(
    "get_advertiser_public_by_nickname",
    { p_nickname: nickname },
  );

  if (error || !data || !Array.isArray(data) || data.length === 0) {
    return null;
  }

  const row = data[0] as Record<string, unknown>;
  return {
    ...mapAdvertiserRow(row),
    active_listing_count: Number(row.active_listing_count ?? 0),
  };
}
