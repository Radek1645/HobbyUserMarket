import { createAdminClient } from "@/lib/supabase/admin";

/** Soft-delete inzerátů po created_at + max lifetime. Volá service_role RPC. */
export async function purgeListingsPastMaxLifetime(): Promise<number> {
  const adminResult = createAdminClient();
  if (!adminResult.ok) {
    console.error("purgeListingsPastMaxLifetime: admin client", adminResult.error);
    return 0;
  }

  const { data, error } = await adminResult.client.rpc(
    "purge_listings_past_max_lifetime",
  );

  if (error) {
    console.error("purgeListingsPastMaxLifetime:", error);
    return 0;
  }

  return typeof data === "number" ? data : 0;
}
