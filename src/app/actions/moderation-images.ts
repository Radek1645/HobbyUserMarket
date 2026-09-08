"use server";

import {
  LISTING_IMAGE_BUCKET,
  MODERATION_IMAGE_STAGING_BUCKET,
} from "@/config/app";
import type { ModerationImageReference } from "@/lib/moderation/prepare-moderation-images";
import { prepareImageRenditionsFromOriginalBytes } from "@/lib/moderation/prepare-image-renditions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_ORIGINAL_BUCKETS = new Set([
  LISTING_IMAGE_BUCKET,
  MODERATION_IMAGE_STAGING_BUCKET,
]);

type PrepareRenditionsResult =
  | { ok: true }
  | { ok: false; error: string };

function assertOwnedReference(
  reference: ModerationImageReference,
  userId: string,
): void {
  if (
    !ALLOWED_ORIGINAL_BUCKETS.has(reference.bucket) ||
    !reference.storagePath.startsWith(`${userId}/`)
  ) {
    throw new Error("Fotka nemá platnou vazbu na přihlášený účet.");
  }
}

async function prepareReferenceRenditions(
  admin: ReturnType<typeof createAdminClient> & { ok: true },
  userId: string,
  reference: ModerationImageReference,
): Promise<void> {
  assertOwnedReference(reference, userId);

  const { data: original, error: downloadError } = await admin.client.storage
    .from(reference.bucket)
    .download(reference.storagePath);
  if (downloadError || !original) {
    throw new Error("Fotku se nepodařilo načíst pro AI kontrolu.");
  }

  const originalBytes = Buffer.from(await original.arrayBuffer());
  await prepareImageRenditionsFromOriginalBytes(admin, userId, originalBytes);
}

/**
 * Z immutable originálů vytvoří hash-addressed AI varianty. Edge následně
 * ověří stejný hash originálu a varianty načte ze service-role-only bucketu.
 */
export async function prepareModerationImageRenditions(
  references: ModerationImageReference[],
): Promise<PrepareRenditionsResult> {
  if (references.length === 0) return { ok: true };
  if (references.length > 6) {
    return { ok: false, error: "Maximálně 6 fotek na inzerát." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return {
      ok: false,
      error: "Sezení vypršelo. Obnovte stránku a přihlaste se znovu.",
    };
  }

  const admin = createAdminClient();
  if (!admin.ok) {
    console.error("prepareModerationImageRenditions:", admin.error);
    return {
      ok: false,
      error: "Fotky se nepodařilo připravit pro AI kontrolu.",
    };
  }

  try {
    // Sekvenčně kvůli paměťovému limitu Vercel Function při šesti fotografiích.
    for (const reference of references) {
      await prepareReferenceRenditions(admin, user.id, reference);
    }
    return { ok: true };
  } catch (error) {
    console.error("prepareModerationImageRenditions:", error);
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Fotky se nepodařilo připravit pro AI kontrolu.",
    };
  }
}
