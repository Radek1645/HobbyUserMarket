import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type AdminClientResult =
  | { client: SupabaseClient; ok: true }
  | { ok: false; error: string };

/** Dekóduje `role` z Supabase JWT (anon vs service_role). */
export function getSupabaseJwtRole(key: string): string | null {
  try {
    const parts = key.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    const json = Buffer.from(padded, "base64").toString("utf8");
    const data = JSON.parse(json) as { role?: string };
    return data.role ?? null;
  } catch {
    return null;
  }
}

/**
 * Service-role klient pro server-only operace.
 * Nikdy neimportovat do client komponent.
 */
export function createAdminClient(): AdminClientResult {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return {
      ok: false,
      error:
        "Chybí SUPABASE_SERVICE_ROLE_KEY v .env.local (Supabase → Settings → API → service_role).",
    };
  }

  const role = getSupabaseJwtRole(key);
  if (role !== "service_role") {
    return {
      ok: false,
      error:
        role === "anon"
          ? "SUPABASE_SERVICE_ROLE_KEY obsahuje anon klíč. Vlož service_role klíč ze stejného Supabase projektu."
          : "SUPABASE_SERVICE_ROLE_KEY není platný service_role klíč.",
    };
  }

  return {
    ok: true,
    client: createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    }),
  };
}
