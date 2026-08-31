"use server";

import {
  CURRENT_GDPR_VERSION,
  CURRENT_PRICING_VERSION,
  CURRENT_VOP_VERSION,
} from "@/config/legal";
import { getCurrentUser } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type AcceptLegalDocumentsState = {
  error?: string;
  ok?: boolean;
};

/**
 * Re-consent po změně VOP — jen verze dokumentů a čas souhlasu.
 * Nesahat na age_confirmed_at / marketing_consent_at (past č. 2).
 */
export async function acceptCurrentLegalDocuments(
  _prev: AcceptLegalDocumentsState,
  _formData: FormData,
): Promise<AcceptLegalDocumentsState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Pro potvrzení podmínek se musíte přihlásit." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      vop_version: CURRENT_VOP_VERSION,
      vop_accepted_at: new Date().toISOString(),
      gdpr_version: CURRENT_GDPR_VERSION,
      pricing_version: CURRENT_PRICING_VERSION,
    })
    .eq("id", user.id);

  if (error) {
    console.error("acceptCurrentLegalDocuments:", error);
    return { error: "Souhlas se nepodařilo uložit. Zkuste to prosím znovu." };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
