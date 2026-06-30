import {
  MODERATION_IMAGE_COMPRESS_QUALITY,
  MODERATION_IMAGE_MAX_DIMENSION,
} from "@/config/moderation";

export type ModerationImagePayload = {
  imagesBase64: string[];
  mainImageIndex: number;
};

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
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

function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Fotku se nepodařilo načíst."));
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

async function imageToModerationBase64(img: HTMLImageElement): Promise<string> {
  const { width, height } = scaleDimensions(
    img.naturalWidth,
    img.naturalHeight,
    MODERATION_IMAGE_MAX_DIMENSION,
  );
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Prohlížeč neumí zpracovat fotku.");
  }

  ctx.drawImage(img, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", MODERATION_IMAGE_COMPRESS_QUALITY);
  });

  if (!blob) {
    throw new Error("Fotku se nepodařilo připravit pro AI kontrolu.");
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Fotku se nepodařilo zakódovat."));
    reader.readAsDataURL(blob);
  });

  const comma = dataUrl.indexOf(",");
  return comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
}

export type ModerationImageSource =
  | { kind: "file"; file: File }
  | { kind: "url"; url: string };

/** Zmenší všechny fotky pro jedno volání Edge Function (bezpečnostní filtr). */
export async function prepareModerationImages(
  sources: ModerationImageSource[],
  mainImageIndex: number,
): Promise<ModerationImagePayload | null> {
  if (sources.length === 0) {
    return null;
  }

  const imagesBase64: string[] = [];

  for (const source of sources) {
    const img =
      source.kind === "file"
        ? await loadImageFromFile(source.file)
        : await loadImageFromUrl(source.url);
    imagesBase64.push(await imageToModerationBase64(img));
  }

  const safeMainIndex = Math.min(
    Math.max(mainImageIndex, 0),
    imagesBase64.length - 1,
  );

  return {
    imagesBase64,
    mainImageIndex: safeMainIndex,
  };
}
