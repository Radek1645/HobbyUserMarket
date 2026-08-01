import { createClient } from "@/lib/supabase/server";

/** Počet doručených poptávek (`delivered = true`) per post_id. */
export async function loadDeliveredInquiryCounts(
  postIds: number[],
): Promise<Map<number, number>> {
  const counts = new Map<number, number>();
  if (postIds.length === 0) return counts;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inquiry_events")
    .select("post_id")
    .eq("delivered", true)
    .in("post_id", postIds);

  if (error || !data) return counts;

  for (const row of data) {
    if (row.post_id == null) continue;
    counts.set(row.post_id, (counts.get(row.post_id) ?? 0) + 1);
  }

  return counts;
}
