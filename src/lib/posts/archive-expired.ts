import { createAdminClient } from "@/lib/supabase/admin";

/** Přepne active → archived u inzerátů s expires_at <= now(). Volá service_role RPC. */
export async function archiveExpiredPosts(): Promise<number> {
  const adminResult = createAdminClient();
  if (!adminResult.ok) {
    console.error("archiveExpiredPosts: admin client", adminResult.error);
    return 0;
  }

  const { data, error } = await adminResult.client.rpc("archive_expired_posts");

  if (error) {
    console.error("archiveExpiredPosts:", error);
    return 0;
  }

  return typeof data === "number" ? data : 0;
}
