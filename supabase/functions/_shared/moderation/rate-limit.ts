import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const AI_RATE_LIMIT_PER_HOUR = 20;

function currentHourWindowStart(): string {
  const now = new Date();
  now.setMinutes(0, 0, 0);
  return now.toISOString();
}

/**
 * Fail closed: chybějící config nebo DB chyba = odmítnout request (M6).
 *
 * SEC-H03: přihlášený uživatel dřív mohl číst/psát vlastní `rate_limits`
 * přímo přes Supabase API (grant + RLS „own row“) a limit obejít nebo
 * paralelizovat select+update. `rate_limits` je teď bez grantů/policy pro
 * anon/authenticated; inkrementace jde přes atomický `increment_rate_limit`
 * (INSERT … ON CONFLICT), takže nehrozí race mezi čtením a zápisem počtu.
 */
export async function assertAiModerationRateLimit(
  userId: string,
): Promise<void> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("rate-limit: missing Supabase env");
    throw new Error("RATE_LIMIT_UNAVAILABLE");
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);

  const { data: count, error } = await admin.rpc("increment_rate_limit", {
    p_user_id: userId,
    p_action_type: "ai_check",
    p_window_start: currentHourWindowStart(),
  });

  if (error || typeof count !== "number") {
    console.error("rate-limit rpc:", error);
    throw new Error("RATE_LIMIT_UNAVAILABLE");
  }

  if (count > AI_RATE_LIMIT_PER_HOUR) {
    throw new Error("RATE_LIMIT");
  }
}
