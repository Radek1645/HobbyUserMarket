"use server";

import {
  LISTING_IMAGE_BUCKET,
  LISTING_IMAGE_MAX_FILE_BYTES,
  MODERATION_IMAGE_RENDITION_BUCKET,
  MODERATION_IMAGE_STAGING_BUCKET,
} from "@/config/app";
import {
  MODERATION_GEMINI_IMAGE_MAX_DIMENSION,
  MODERATION_IMAGE_RENDITION_QUALITY,
  MODERATION_SIGHTENGINE_IMAGE_MAX_DIMENSION,
} from "@/config/moderation";
import { detectFileKindFromBytes } from "@/lib/files/magic-bytes";
import type { ModerationImageReference } from "@/lib/moderation/prepare-moderation-images";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { createHash } from "node:crypto";
import sharp from "sharp";

const ALLOWED_ORIGINAL_BUCKETS = new Set([
  LISTING_IMAGE_BUCKET,
  MODERATION_IMAGE_STAGING_BUCKET,
]);
const ALLOWED_IMAGE_KINDS = new Set(["jpeg", "png", "webp"]);
const MODERATION_IMAGE_MAX_INPUT_PIXELS = 40_000_000;

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

function buildRenditionPaths(userId: string, imageHash: string) {
  const prefix = `${userId}/${imageHash}`;
  return {
    prefix,
    gemini: `${prefix}/gemini.webp`,
    sightengine: `${prefix}/sightengine.webp`,
  };
}

async function uploadRendition(
  admin: ReturnType<typeof createAdminClient> & { ok: true },
  storagePath: string,
  bytes: Buffer,
): Promise<void> {
  if (bytes.byteLength > LISTING_IMAGE_MAX_FILE_BYTES) {
    throw new Error("AI varianta fotografie je příliš velká.");
  }

  const { error } = await admin.client.storage
    .from(MODERATION_IMAGE_RENDITION_BUCKET)
    .upload(storagePath, bytes, {
      contentType: "image/webp",
      upsert: true,
    });
  if (error) {
    throw new Error("AI variantu fotografie se nepodařilo uložit.");
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
  if (originalBytes.byteLength > LISTING_IMAGE_MAX_FILE_BYTES) {
    throw new Error("Fotka pro AI kontrolu je příliš velká.");
  }

  const kind = detectFileKindFromBytes(originalBytes);
  if (!kind || !ALLOWED_IMAGE_KINDS.has(kind)) {
    throw new Error("Fotka nemá podporovaný formát JPG, PNG nebo WebP.");
  }

  const imageHash = createHash("sha256").update(originalBytes).digest("hex");
  const paths = buildRenditionPaths(userId, imageHash);
  const { data: cachedFiles, error: cacheError } = await admin.client.storage
    .from(MODERATION_IMAGE_RENDITION_BUCKET)
    .list(paths.prefix, { limit: 2 });
  if (cacheError) {
    throw new Error("AI varianty fotografií se nepodařilo ověřit.");
  }

  const cachedNames = new Set((cachedFiles ?? []).map((file) => file.name));
  if (
    cachedNames.has("gemini.webp") &&
    cachedNames.has("sightengine.webp")
  ) {
    return;
  }

  const image = sharp(originalBytes, {
    failOn: "error",
    limitInputPixels: MODERATION_IMAGE_MAX_INPUT_PIXELS,
  }).rotate();
  const [geminiBytes, sightengineBytes] = await Promise.all([
    image
      .clone()
      .resize({
        width: MODERATION_GEMINI_IMAGE_MAX_DIMENSION,
        height: MODERATION_GEMINI_IMAGE_MAX_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: MODERATION_IMAGE_RENDITION_QUALITY })
      .toBuffer(),
    image
      .clone()
      .resize({
        width: MODERATION_SIGHTENGINE_IMAGE_MAX_DIMENSION,
        height: MODERATION_SIGHTENGINE_IMAGE_MAX_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: MODERATION_IMAGE_RENDITION_QUALITY })
      .toBuffer(),
  ]);

  await Promise.all([
    uploadRendition(admin, paths.gemini, geminiBytes),
    uploadRendition(admin, paths.sightengine, sightengineBytes),
  ]);
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
