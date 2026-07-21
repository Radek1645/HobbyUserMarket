/**
 * Evidence hard rejectů + counter v 24h okně (fáze 1 bez auto-suspend).
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";
import {
  HARD_REJECT_AUTOBAN_THRESHOLD,
  HARD_REJECT_WINDOW_MS,
  MODERATION_EVIDENCE_BUCKET,
} from "./constants.ts";

export type HardRejectEvidenceKind =
  | "hard_hit_text"
  | "nsfw_image"
  | "sightengine_unavailable"
  | "hard_reject_threshold_reached";

export type RecordHardRejectEvidenceParams = {
  userId: string;
  kind: HardRejectEvidenceKind;
  matchedCategory?: string;
  reason?: string;
  matchedTerm?: string;
  titleSnippet?: string;
  storagePath?: string;
  imageIndex?: number;
};

function createServiceClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("EVIDENCE_SUPABASE_ENV_MISSING");
  }
  return createClient(supabaseUrl, serviceRoleKey);
}

function stripBase64Payload(imageBase64: string): string {
  const trimmed = imageBase64.trim();
  const comma = trimmed.indexOf(",");
  if (trimmed.startsWith("data:") && comma !== -1) {
    return trimmed.slice(comma + 1);
  }
  return trimmed;
}

/** Uloží JPEG snapshot do privátního bucketu; při chybě vrátí null (evidence jde dál). */
export async function uploadNsfwEvidenceImage(
  userId: string,
  imageBase64: string,
  imageIndex: number,
): Promise<string | null> {
  try {
    const admin = createServiceClient();
    const payload = stripBase64Payload(imageBase64);
    const binary = atob(payload);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const path = `${userId}/${Date.now()}-${imageIndex}.jpg`;
    const { error } = await admin.storage
      .from(MODERATION_EVIDENCE_BUCKET)
      .upload(path, bytes, {
        contentType: "image/jpeg",
        upsert: false,
      });

    if (error) {
      console.error("evidence upload:", error);
      return null;
    }
    return path;
  } catch (error) {
    console.error("evidence upload exception:", error);
    return null;
  }
}

export async function recordHardRejectEvidence(
  params: RecordHardRejectEvidenceParams,
): Promise<void> {
  try {
    const admin = createServiceClient();
    const { error } = await admin.from("moderation_hard_reject_evidence").insert({
      user_id: params.userId,
      kind: params.kind,
      matched_category: params.matchedCategory ?? null,
      reason: params.reason ?? null,
      matched_term: params.matchedTerm ?? null,
      title_snippet: params.titleSnippet
        ? params.titleSnippet.slice(0, 80)
        : null,
      storage_path: params.storagePath ?? null,
      image_index: params.imageIndex ?? null,
    });

    if (error) {
      console.error("evidence insert:", error);
    }
  } catch (error) {
    console.error("evidence insert exception:", error);
  }
}

/**
 * Po hard rejectu spočítá hits v okně; při dosažení thresholdu zaloguje event
 * (suspend až fáze 2).
 */
export async function incrementHardRejectAndMaybeLogThreshold(
  userId: string,
): Promise<void> {
  try {
    const admin = createServiceClient();
    const windowStart = new Date(
      Date.now() - HARD_REJECT_WINDOW_MS,
    ).toISOString();

    const { count, error } = await admin
      .from("moderation_hard_reject_evidence")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .in("kind", ["hard_hit_text", "nsfw_image"])
      .gte("created_at", windowStart);

    if (error) {
      console.error("hard-reject count:", error);
      return;
    }

    const hitCount = count ?? 0;
    if (hitCount !== HARD_REJECT_AUTOBAN_THRESHOLD) {
      return;
    }

    await recordHardRejectEvidence({
      userId,
      kind: "hard_reject_threshold_reached",
      reason: `count=${hitCount};threshold=${HARD_REJECT_AUTOBAN_THRESHOLD};window_ms=${HARD_REJECT_WINDOW_MS}`,
    });

    console.log(
      "hard_reject_threshold_reached:",
      JSON.stringify({ userId, count: hitCount }),
    );
  } catch (error) {
    console.error("hard-reject threshold:", error);
  }
}
