import {
  LISTING_IMAGE_MAX_FILE_BYTES,
  MODERATION_IMAGE_RENDITION_BUCKET,
} from "@/config/app";
import {
  MODERATION_GEMINI_IMAGE_MAX_DIMENSION,
  MODERATION_IMAGE_RENDITION_MIN_QUALITY,
  MODERATION_IMAGE_RENDITION_QUALITY,
  MODERATION_IMAGE_RENDITION_QUALITY_STEP,
  MODERATION_SIGHTENGINE_IMAGE_MAX_DIMENSION,
} from "@/config/moderation";
import { detectFileKindFromBytes } from "@/lib/files/magic-bytes";
import { buildModerationRenditionPaths } from "@/lib/moderation/rendition-paths";
import type { AdminClientResult } from "@/lib/supabase/admin";
import { createHash } from "node:crypto";
import sharp, { type Sharp } from "sharp";

type AdminOk = Extract<AdminClientResult, { ok: true }>;

const ALLOWED_IMAGE_KINDS = new Set(["jpeg", "png", "webp"]);
const MODERATION_IMAGE_MAX_INPUT_PIXELS = 40_000_000;
const RENDITION_CACHE_LIST_LIMIT = 32;
const RENDITION_DIMENSION_ATTEMPTS = 8;
const RENDITION_DIMENSION_SCALE = 0.85;

async function uploadRendition(
  admin: AdminOk,
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
    console.error("moderation rendition upload:", storagePath, error);
    throw new Error("AI variantu fotografie se nepodařilo uložit.");
  }
}

async function encodeWebpUnderByteLimit(
  image: Sharp,
  maxDimension: number,
): Promise<Buffer> {
  let dimension = maxDimension;

  for (let attempt = 0; attempt < RENDITION_DIMENSION_ATTEMPTS; attempt += 1) {
    for (
      let quality = MODERATION_IMAGE_RENDITION_QUALITY;
      quality >= MODERATION_IMAGE_RENDITION_MIN_QUALITY;
      quality -= MODERATION_IMAGE_RENDITION_QUALITY_STEP
    ) {
      const bytes = await image
        .clone()
        .resize({
          width: dimension,
          height: dimension,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality })
        .toBuffer();
      if (bytes.byteLength <= LISTING_IMAGE_MAX_FILE_BYTES) {
        return bytes;
      }
    }

    dimension = Math.max(1, Math.round(dimension * RENDITION_DIMENSION_SCALE));
  }

  throw new Error("AI varianta fotografie je příliš velká.");
}

/**
 * Z bajtů originálu udělá hash-addressed Gemini/Sightengine WebP.
 * Cache klíč nese rozlišení v názvu souboru; upload čte Storage `error`.
 */
export async function prepareImageRenditionsFromOriginalBytes(
  admin: AdminOk,
  ownerPrefix: string,
  originalBytes: Buffer,
): Promise<void> {
  if (originalBytes.byteLength > LISTING_IMAGE_MAX_FILE_BYTES) {
    throw new Error("Fotka pro AI kontrolu je příliš velká.");
  }

  const kind = detectFileKindFromBytes(originalBytes);
  if (!kind || !ALLOWED_IMAGE_KINDS.has(kind)) {
    throw new Error("Fotka nemá podporovaný formát JPG, PNG nebo WebP.");
  }

  const imageHash = createHash("sha256").update(originalBytes).digest("hex");
  const paths = buildModerationRenditionPaths(ownerPrefix, imageHash);
  const { data: cachedFiles, error: cacheError } = await admin.client.storage
    .from(MODERATION_IMAGE_RENDITION_BUCKET)
    .list(paths.prefix, { limit: RENDITION_CACHE_LIST_LIMIT });
  if (cacheError) {
    throw new Error("AI varianty fotografií se nepodařilo ověřit.");
  }

  const cachedNames = new Set((cachedFiles ?? []).map((file) => file.name));
  if (
    cachedNames.has(paths.geminiFileName) &&
    cachedNames.has(paths.sightengineFileName)
  ) {
    return;
  }

  const image = sharp(originalBytes, {
    failOn: "error",
    limitInputPixels: MODERATION_IMAGE_MAX_INPUT_PIXELS,
  }).rotate();

  const [geminiBytes, sightengineBytes] = await Promise.all([
    encodeWebpUnderByteLimit(image, MODERATION_GEMINI_IMAGE_MAX_DIMENSION),
    encodeWebpUnderByteLimit(
      image,
      MODERATION_SIGHTENGINE_IMAGE_MAX_DIMENSION,
    ),
  ]);

  await Promise.all([
    uploadRendition(admin, paths.gemini, geminiBytes),
    uploadRendition(admin, paths.sightengine, sightengineBytes),
  ]);
}
