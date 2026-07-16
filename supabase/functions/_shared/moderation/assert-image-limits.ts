/** Validace velikosti a magic bytes base64 fotek v moderate-listing (M7). */

import {
  MODERATION_IMAGE_MAX_BYTES,
  MODERATION_IMAGES_MAX_TOTAL_BYTES,
} from "./constants.ts";

function stripDataUrlPrefix(input: string): string {
  const comma = input.indexOf(",");
  if (input.startsWith("data:") && comma >= 0) {
    return input.slice(comma + 1);
  }
  return input;
}

function decodeBase64Bytes(input: string): Uint8Array {
  const raw = stripDataUrlPrefix(input).replace(/\s/g, "");
  const binary = atob(raw);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function isJpegMagic(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  );
}

function isPngMagic(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  );
}

function isWebpMagic(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  );
}

function isAllowedImageMagic(bytes: Uint8Array): boolean {
  return isJpegMagic(bytes) || isPngMagic(bytes) || isWebpMagic(bytes);
}

/**
 * Ověří každou fotku: dekódovatelný base64, magic bytes, limity velikosti.
 * @throws Error s message IMAGE_TOO_LARGE | IMAGE_INVALID | IMAGES_TOTAL_TOO_LARGE
 */
export function assertModerationImagesWithinLimits(
  imagesBase64: string[],
): void {
  let totalBytes = 0;

  for (const encoded of imagesBase64) {
    let bytes: Uint8Array;
    try {
      bytes = decodeBase64Bytes(encoded);
    } catch {
      throw new Error("IMAGE_INVALID");
    }

    if (bytes.length < 1 || !isAllowedImageMagic(bytes)) {
      throw new Error("IMAGE_INVALID");
    }

    if (bytes.length > MODERATION_IMAGE_MAX_BYTES) {
      throw new Error("IMAGE_TOO_LARGE");
    }

    totalBytes += bytes.length;
    if (totalBytes > MODERATION_IMAGES_MAX_TOTAL_BYTES) {
      throw new Error("IMAGES_TOTAL_TOO_LARGE");
    }
  }
}
