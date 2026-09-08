import {
  CAMPAIGN_ATTRIBUTION_FORM_FIELD,
  parseCampaignAttributionFromFormValue,
  type CampaignAttribution,
} from "@/lib/promo/campaign-query";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * First-touch UTM k inzerátu. Přepisuje jen když je sloupec ještě prázdný.
 * Chyba zápisu publikaci neshodí.
 */
export async function persistListingCampaignAttribution(
  admin: SupabaseClient,
  postId: number,
  formData: FormData,
): Promise<void> {
  const attribution = parseCampaignAttributionFromFormValue(
    formData.get(CAMPAIGN_ATTRIBUTION_FORM_FIELD),
  );
  if (!attribution) {
    return;
  }

  const { error } = await admin
    .from("posts")
    .update({ campaign_attribution: attribution })
    .eq("id", postId)
    .is("campaign_attribution", null);

  if (error) {
    console.error("persistListingCampaignAttribution:", error);
  }
}

export async function loadListingCampaignAttribution(
  postId: number,
): Promise<CampaignAttribution | null> {
  const admin = createAdminClient();
  if (!admin.ok) {
    return null;
  }

  const { data, error } = await admin.client
    .from("posts")
    .select("campaign_attribution")
    .eq("id", postId)
    .maybeSingle<{ campaign_attribution: CampaignAttribution | null }>();

  if (error) {
    console.error("loadListingCampaignAttribution:", error);
    return null;
  }

  return data?.campaign_attribution ?? null;
}

export async function loadListingsCampaignAttribution(
  postIds: number[],
): Promise<Map<number, CampaignAttribution | null>> {
  const result = new Map<number, CampaignAttribution | null>();
  if (postIds.length === 0) {
    return result;
  }

  const admin = createAdminClient();
  if (!admin.ok) {
    return result;
  }

  const { data, error } = await admin.client
    .from("posts")
    .select("id, campaign_attribution")
    .in("id", postIds)
    .returns<
      Array<{ id: number; campaign_attribution: CampaignAttribution | null }>
    >();

  if (error) {
    console.error("loadListingsCampaignAttribution:", error);
    return result;
  }

  for (const row of data ?? []) {
    result.set(row.id, row.campaign_attribution);
  }
  return result;
}
