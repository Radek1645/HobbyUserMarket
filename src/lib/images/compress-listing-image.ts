import {
  LISTING_IMAGE_COMPRESS_QUALITY,
  LISTING_IMAGE_MAX_DIMENSION,
  LISTING_IMAGE_MAX_FILE_BYTES,
} from "@/config/app";

function supportsWebP(): boolean {
  const canvas = document.createElement("canvas");
  return canvas.toDataURL("image/webp").startsWith("data:image/webp");
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Fotku se nepodařilo načíst."));
    };
    img.src = url;
  });
}

function scaleDimensions(
  width: number,
  height: number,
  maxDimension: number,
): { width: number; height: number } {
  if (width <= maxDimension && height <= maxDimension) {
    return { width, height };
  }

  const ratio = Math.min(maxDimension / width, maxDimension / height);
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, mimeType, quality);
  });
}

async function encodeUnderByteLimit(
  canvas: HTMLCanvasElement,
  mimeType: string,
  maxBytes: number,
): Promise<Blob | null> {
  let quality = LISTING_IMAGE_COMPRESS_QUALITY;
  let blob = await canvasToBlob(canvas, mimeType, quality);

  while (blob && blob.size > maxBytes && quality > 0.45) {
    quality -= 0.07;
    blob = await canvasToBlob(canvas, mimeType, quality);
  }

  return blob;
}

function buildCompressedFile(
  blob: Blob,
  source: File,
  mimeType: string,
): File {
  const ext = mimeType === "image/webp" ? "webp" : "jpg";
  const stem = source.name.replace(/\.[^.]+$/u, "") || "foto";
  return new File([blob], `${stem}.${ext}`, {
    type: mimeType,
    lastModified: Date.now(),
  });
}

/** Zmenší fotku na klientovi (resize + WebP/JPEG) pod limit z configu. */
export async function compressListingImage(file: File): Promise<File> {
  const mimeType = supportsWebP() ? "image/webp" : "image/jpeg";
  const img = await loadImage(file);
  let maxDimension = LISTING_IMAGE_MAX_DIMENSION;
  let resultBlob: Blob | null = null;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const { width, height } = scaleDimensions(
      img.naturalWidth,
      img.naturalHeight,
      maxDimension,
    );
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Prohlížeč neumí zpracovat fotku.");
    }

    ctx.drawImage(img, 0, 0, width, height);
    resultBlob = await encodeUnderByteLimit(
      canvas,
      mimeType,
      LISTING_IMAGE_MAX_FILE_BYTES,
    );

    if (resultBlob && resultBlob.size <= LISTING_IMAGE_MAX_FILE_BYTES) {
      return buildCompressedFile(resultBlob, file, mimeType);
    }

    maxDimension = Math.round(maxDimension * 0.85);
  }

  throw new Error("Fotku se nepodařilo zmenšit pod 1 MB.");
}
