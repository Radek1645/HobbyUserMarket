export type ModerationImagePayload = {
  /** Přesné base64 bajty souborů, které se ukládají do Storage. */
  imagesBase64: string[];
  imageMimeTypes: string[];
  mainImageIndex: number;
};

export type ModerationImageSource =
  | { kind: "file"; file: File }
  | { kind: "url"; url: string };

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 32_768;
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const chunk = bytes.subarray(offset, offset + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function normalizeMimeType(value: string | null | undefined): string {
  const mimeType = String(value ?? "")
    .split(";")[0]
    .trim()
    .toLowerCase();
  if (!ALLOWED_IMAGE_MIME_TYPES.has(mimeType)) {
    throw new Error("Fotka nemá podporovaný formát JPG, PNG nebo WebP.");
  }
  return mimeType;
}

async function readSource(
  source: ModerationImageSource,
): Promise<{ bytes: ArrayBuffer; mimeType: string }> {
  if (source.kind === "file") {
    return {
      bytes: await source.file.arrayBuffer(),
      mimeType: normalizeMimeType(source.file.type),
    };
  }

  const response = await fetch(source.url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Fotku se nepodařilo načíst pro bezpečnostní kontrolu.");
  }
  return {
    bytes: await response.arrayBuffer(),
    mimeType: normalizeMimeType(response.headers.get("content-type")),
  };
}

/**
 * Připraví přesné soubory pro AI kontrolu. SEC-H02 vyžaduje, aby Edge
 * hashoval stejné bajty, které Server Action následně uloží / načte ze Storage;
 * zmenšený canvas náhled by tuto vazbu neprokazoval.
 */
export async function prepareModerationImages(
  sources: ModerationImageSource[],
  mainImageIndex: number,
): Promise<ModerationImagePayload | null> {
  if (sources.length === 0) {
    return null;
  }

  const imagesBase64: string[] = [];
  const imageMimeTypes: string[] = [];

  for (const source of sources) {
    const { bytes, mimeType } = await readSource(source);
    imagesBase64.push(arrayBufferToBase64(bytes));
    imageMimeTypes.push(mimeType);
  }

  return {
    imagesBase64,
    imageMimeTypes,
    mainImageIndex: Math.min(
      Math.max(mainImageIndex, 0),
      imagesBase64.length - 1,
    ),
  };
}
