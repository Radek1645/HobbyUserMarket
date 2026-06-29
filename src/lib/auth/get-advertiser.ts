import type { AdvertiserProfile } from "@/lib/auth/advertiser-display";
import { createClient } from "@/lib/supabase/server";

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

  return data[0] as AdvertiserProfile;
}
