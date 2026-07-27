import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

/**
 * Vydá approval token (H1) po průchodu bezpečnostním filtrem.
 * Token spotřebuje Next.js Server Action přes publish_approved_post.
 * Vrací null při chybě/chybějícím service role klíči (fail safe — bez tokenu
 * server publikaci nepovolí, takže se nic „nepropustí“).
 *
 * SEC-H01/H02: token se váže na přesný finální text + strukturovaná pole
 * (`contentFingerprint`) a na SHA-256 všech moderovaných fotografií.
 */
export async function issueModerationApproval(
  userId: string,
  imageCount: number,
  contentFingerprint: string,
  imageHashes: string[],
): Promise<string | null> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("issue-approval: missing Supabase env");
    return null;
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const { data, error } = await admin.rpc("issue_moderation_approval", {
    p_user_id: userId,
    p_image_count: imageCount,
    p_content_fingerprint: contentFingerprint,
    p_image_hashes: imageHashes,
  });

  if (error) {
    console.error("issue-approval rpc:", error);
    return null;
  }

  return typeof data === "string" ? data : null;
}
