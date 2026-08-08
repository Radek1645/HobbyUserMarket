import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";
import {
  LISTING_IMAGE_BUCKET,
  MODERATION_IMAGE_RENDITION_BUCKET,
  MODERATION_IMAGE_STAGING_BUCKET,
} from "./constants.ts";
import {
  assertModerationImagesWithinLimits,
  decodeBase64Bytes,
  detectImageMimeType,
} from "./assert-image-limits.ts";

export type StorageImageReference = {
  bucket: string;
  storagePath: string;
};

export type LoadedModerationImages = {
  imageHashes: string[];
  geminiImagesBase64: string[];
  geminiImageMimeTypes: string[];
  sightengineImagesBase64: string[];
  sightengineImageMimeTypes: string[];
};

const ALLOWED_BUCKETS = new Set([
  LISTING_IMAGE_BUCKET,
  MODERATION_IMAGE_STAGING_BUCKET,
]);

function bytesToBase64(bytes: Uint8Array): string {
  const chunkSize = 32_768;
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(
      ...bytes.subarray(offset, offset + chunkSize),
    );
  }
  return btoa(binary);
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    Uint8Array.from(bytes).buffer,
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function assertOwnedReference(
  reference: StorageImageReference,
  ownerPrefix: string,
): void {
  if (
    !ALLOWED_BUCKETS.has(reference.bucket) ||
    !reference.storagePath.startsWith(`${ownerPrefix}/`)
  ) {
    throw new Error("IMAGE_REFERENCE_FORBIDDEN");
  }
}

/**
 * Načte plné Storage objekty pro SEC-H02 a hash-addressed varianty vytvořené
 * přes Sharp do service-role-only bucketu.
 *
 * `ownerPrefix` = userId (auth) nebo `guest/{visitorId}` (guest preview).
 */
export async function loadModerationImagesFromStorage(
  references: StorageImageReference[],
  ownerPrefix: string,
): Promise<LoadedModerationImages> {
  if (references.length === 0) {
    return {
      imageHashes: [],
      geminiImagesBase64: [],
      geminiImageMimeTypes: [],
      sightengineImagesBase64: [],
      sightengineImageMimeTypes: [],
    };
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("STORAGE_CONFIG_MISSING");
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);
  async function loadTrustedRendition(
    storagePath: string,
  ): Promise<{ base64: string; mimeType: string }> {
    const { data, error } = await admin.storage
      .from(MODERATION_IMAGE_RENDITION_BUCKET)
      .download(storagePath);
    if (error || !data) {
      throw new Error("IMAGE_RENDITION_MISSING");
    }

    const bytes = new Uint8Array(await data.arrayBuffer());
    const mimeType = detectImageMimeType(bytes);
    if (mimeType !== "image/webp") {
      throw new Error("IMAGE_RENDITION_INVALID");
    }
    return { base64: bytesToBase64(bytes), mimeType };
  }

  const loadedImages = await Promise.all(references.map(async (reference) => {
    assertOwnedReference(reference, ownerPrefix);

    const { data: original, error: downloadError } = await admin.storage
      .from(reference.bucket)
      .download(reference.storagePath);
    if (downloadError || !original) {
      throw new Error("IMAGE_DOWNLOAD_FAILED");
    }

    const originalBytes = new Uint8Array(await original.arrayBuffer());
    const originalBase64 = bytesToBase64(originalBytes);
    assertModerationImagesWithinLimits([originalBase64]);
    const imageHash = await sha256Hex(originalBytes);
    const renditionPrefix = `${ownerPrefix}/${imageHash}`;

    const [geminiImage, sightengineImage] = await Promise.all([
      loadTrustedRendition(`${renditionPrefix}/gemini.webp`),
      loadTrustedRendition(`${renditionPrefix}/sightengine.webp`),
    ]);
    return {
      originalBase64,
      imageHash,
      geminiImage,
      sightengineImage,
    };
  }));

  const originalImagesBase64 = loadedImages.map((image) =>
    image.originalBase64
  );
  const imageHashes = loadedImages.map((image) => image.imageHash);
  const geminiImagesBase64 = loadedImages.map(
    (image) => image.geminiImage.base64,
  );
  const geminiImageMimeTypes = loadedImages.map(
    (image) => image.geminiImage.mimeType,
  );
  const sightengineImagesBase64 = loadedImages.map(
    (image) => image.sightengineImage.base64,
  );
  const sightengineImageMimeTypes = loadedImages.map(
    (image) => image.sightengineImage.mimeType,
  );

  assertModerationImagesWithinLimits(originalImagesBase64);
  assertModerationImagesWithinLimits(geminiImagesBase64);
  assertModerationImagesWithinLimits(sightengineImagesBase64);

  // Ověří magic bytes i po base64 roundtripu; chrání i budoucí změny encoderu.
  for (const encoded of geminiImagesBase64) {
    if (!detectImageMimeType(decodeBase64Bytes(encoded))) {
      throw new Error("IMAGE_TRANSFORM_INVALID");
    }
  }

  return {
    imageHashes,
    geminiImagesBase64,
    geminiImageMimeTypes,
    sightengineImagesBase64,
    sightengineImageMimeTypes,
  };
}
