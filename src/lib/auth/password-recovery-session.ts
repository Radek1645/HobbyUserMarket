/**
 * Session po e-mailovém odkazu na obnovu hesla (SEC-M10).
 * `updatePassword` / `/auth/nastavit-heslo` smí běžet jen s čerstvým AMR `recovery`.
 */

import { PASSWORD_RECOVERY_SESSION_MAX_AGE_SECONDS } from "@/config/app";
import type { SupabaseClient } from "@supabase/supabase-js";

export const PASSWORD_RECOVERY_REQUIRED_ERROR =
  "Odkaz pro obnovení hesla vypršel nebo neplatí. Požádejte o nový odkaz.";

function isFreshUnixTimestamp(timestampSeconds: number, nowSeconds: number): boolean {
  const ageSeconds = nowSeconds - timestampSeconds;
  return (
    ageSeconds >= 0 && ageSeconds <= PASSWORD_RECOVERY_SESSION_MAX_AGE_SECONDS
  );
}

/**
 * True, když JWT claims obsahují AMR metodu `recovery` v povoleném stáří.
 * Bez toho by stačila libovolná session a `/auth/nastavit-heslo` by obešlo
 * požadavek na stávající heslo v nastavení účtu.
 */
export async function sessionHasFreshPasswordRecovery(
  supabase: SupabaseClient,
): Promise<boolean> {
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    return false;
  }

  const amr = data.claims.amr;
  if (!Array.isArray(amr) || amr.length === 0) {
    return false;
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  let sawRecoveryString = false;

  for (const entry of amr) {
    if (typeof entry === "string") {
      if (entry === "recovery") {
        sawRecoveryString = true;
      }
      continue;
    }

    if (
      entry &&
      typeof entry === "object" &&
      entry.method === "recovery" &&
      typeof entry.timestamp === "number" &&
      isFreshUnixTimestamp(entry.timestamp, nowSeconds)
    ) {
      return true;
    }
  }

  // RFC-8176 string[] bez timestampu — stáří odvodíme z iat JWT.
  if (sawRecoveryString && typeof data.claims.iat === "number") {
    return isFreshUnixTimestamp(data.claims.iat, nowSeconds);
  }

  return false;
}
