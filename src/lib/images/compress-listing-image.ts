import {
  LISTING_IMAGE_COMPRESS_QUALITY,
  LISTING_IMAGE_MAX_DIMENSION,
  LISTING_IMAGE_MAX_FILE_BYTES,
} from "@/config/app";
import {
  detectFileKindFromBytes,
  looksLikeAvifBytes,
  looksLikeHeifBytes,
} from "@/lib/files/magic-bytes";

const IMAGE_LOAD_FAILED =
  "Fotku se nepodařilo načíst. Zkuste ji vyfotit tlačítkem Vyfotit, nebo vyberte jiný snímek.";
const IMAGE_HEIC_FAILED =
  "Tento formát (HEIC) prohlížeč neumí načíst. Vyfoťte snímek tlačítkem Vyfotit, nebo v nastavení foťáku zapněte JPEG.";
const IMAGE_UNSUPPORTED =
  "Použijte fotku ve formátu JPG, PNG nebo WebP.";

type DecodedImage = {
  source: CanvasImageSource;
  width: number;
  height: number;
  close: () => void;
};

function supportsWebP(): boolean {
  const canvas = document.createElement("canvas");
  return canvas.toDataURL("image/webp").startsWith("data:image/webp");
}

function mimeForDecode(file: File, bytes: Uint8Array): string {
  if (looksLikeHeifBytes(bytes)) return "image/heic";
  if (looksLikeAvifBytes(bytes)) return "image/avif";
  const kind = detectFileKindFromBytes(bytes);
  if (kind === "jpeg") return "image/jpeg";
  if (kind === "png") return "image/png";
  if (kind === "webp") return "image/webp";
  if (file.type.startsWith("image/")) return file.type;
  return "image/jpeg";
}

function decodeErrorMessage(bytes: Uint8Array): string {
  if (looksLikeHeifBytes(bytes)) return IMAGE_HEIC_FAILED;
  const kind = detectFileKindFromBytes(bytes);
  if (kind === "jpeg" || kind === "png" || kind === "webp" || looksLikeAvifBytes(bytes)) {
    return IMAGE_LOAD_FAILED;
  }
  return IMAGE_UNSUPPORTED;
}

function loadHtmlImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      if (img.naturalWidth < 1 || img.naturalHeight < 1) {
        reject(new Error(IMAGE_LOAD_FAILED));
        return;
      }
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(IMAGE_LOAD_FAILED));
    };
    img.src = url;
  });
}

async function createOrientedBitmap(blob: Blob): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(blob, { imageOrientation: "from-image" });
  } catch {
    return await createImageBitmap(blob);
  }
}

/**
 * Nejdřív dočte soubor (Android galerie jinak občas vrátí prázdný blob),
 * pak zkusí createImageBitmap a až potom Image().
 */
async function decodeImageSource(file: File): Promise<DecodedImage> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.byteLength === 0) {
    throw new Error(IMAGE_LOAD_FAILED);
  }

  const blob = new Blob([bytes], { type: mimeForDecode(file, bytes) });

  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createOrientedBitmap(blob);
      if (bitmap.width >= 1 && bitmap.height >= 1) {
        return {
          source: bitmap,
          width: bitmap.width,
          height: bitmap.height,
          close: () => bitmap.close(),
        };
      }
      bitmap.close();
    } catch {
      // Image() níže; HEIC na Android Chrome často projde jen přes bitmap.
    }
  }

  try {
    const img = await loadHtmlImage(blob);
    return {
      source: img,
      width: img.naturalWidth,
      height: img.naturalHeight,
      close: () => undefined,
    };
  } catch (error) {
    console.warn("compressListingImage: decode failed", {
      name: file.name,
      type: file.type,
      size: file.size,
      heif: looksLikeHeifBytes(bytes),
      reason: error instanceof Error ? error.message : "unknown",
    });
    throw new Error(decodeErrorMessage(bytes));
  }
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
  const decoded = await decodeImageSource(file);

  try {
    let maxDimension = LISTING_IMAGE_MAX_DIMENSION;
    let resultBlob: Blob | null = null;

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const { width, height } = scaleDimensions(
        decoded.width,
        decoded.height,
        maxDimension,
      );
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Prohlížeč neumí zpracovat fotku.");
      }

      ctx.drawImage(decoded.source, 0, 0, width, height);
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
  } finally {
    decoded.close();
  }
}
