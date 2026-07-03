import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const AI_RATE_LIMIT_PER_HOUR = 20;

function currentHourWindowStart(): string {
  const now = new Date();
  now.setMinutes(0, 0, 0);
  return now.toISOString();
}

export async function assertAiModerationRateLimit(
  userId: string,
): Promise<void> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    console.warn("rate-limit: missing Supabase env, skipping check");
    return;
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const windowStart = currentHourWindowStart();

  const { data: existing, error: selectError } = await admin
    .from("rate_limits")
    .select("id, count")
    .eq("user_id", userId)
    .eq("action_type", "ai_check")
    .eq("window_start", windowStart)
    .maybeSingle();

  if (selectError) {
    console.error("rate-limit select:", selectError);
    return;
  }

  if (existing && existing.count >= AI_RATE_LIMIT_PER_HOUR) {
    const error = new Error("RATE_LIMIT");
    throw error;
  }

  if (existing) {
    const { error: updateError } = await admin
      .from("rate_limits")
      .update({ count: existing.count + 1 })
      .eq("id", existing.id);

    if (updateError) {
      console.error("rate-limit update:", updateError);
    }
    return;
  }

  const { error: insertError } = await admin.from("rate_limits").insert({
    user_id: userId,
    action_type: "ai_check",
    count: 1,
    window_start: windowStart,
  });

  if (insertError) {
    console.error("rate-limit insert:", insertError);
  }
}
