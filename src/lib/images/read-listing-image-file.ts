/**
 * Samsung / Android Chrome: soubor z galerie je content URI.
 * Po prvním await (nebo u druhé fotky v dávce) URI ztratí oprávnění
 * → DOMException NotReadableError („could not be read… permission problems“).
 * Foťák (`capture`) vrací blob v paměti, proto Vyfotit funguje.
 */

export const LISTING_IMAGE_GALLERY_READ_FAILED =
  "Fotku z galerie se nepodařilo načíst. Zkuste ji vyfotit tlačítkem Vyfotit, nebo v galerii zvolte snímek uložený v telefonu.";

export type ListingImageSnapshotResult =
  | { ok: true; file: File }
  | { ok: false; name: string; error: string };

function isNotReadableError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === "NotReadableError") {
    return true;
  }
  const message = error instanceof Error ? error.message : String(error);
  return /could not be read|permission problems/i.test(message);
}

/** User-facing text — nikdy nepouštěj anglický DOMException do UI. */
export function listingImageUserError(error: unknown): string {
  if (isNotReadableError(error)) return LISTING_IMAGE_GALLERY_READ_FAILED;
  if (error instanceof Error && error.message.trim()) return error.message;
  return LISTING_IMAGE_GALLERY_READ_FAILED;
}

function readWithFileReader(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
        return;
      }
      reject(new Error(LISTING_IMAGE_GALLERY_READ_FAILED));
    };
    reader.onerror = () => {
      reject(reader.error ?? new Error(LISTING_IMAGE_GALLERY_READ_FAILED));
    };
    reader.readAsArrayBuffer(blob);
  });
}

async function readBytes(file: File): Promise<ArrayBuffer> {
  try {
    return await file.arrayBuffer();
  } catch (arrayBufferError) {
    try {
      return await readWithFileReader(file);
    } catch {
      const url = URL.createObjectURL(file);
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw arrayBufferError;
        }
        return await response.arrayBuffer();
      } finally {
        URL.revokeObjectURL(url);
      }
    }
  }
}

/** Zkopíruje jednu fotku do paměti, dokud Android URI ještě platí. */
export async function snapshotListingImageFile(file: File): Promise<File> {
  try {
    const buffer = await readBytes(file);
    if (buffer.byteLength === 0) {
      throw new Error(LISTING_IMAGE_GALLERY_READ_FAILED);
    }
    return new File([buffer], file.name || "foto.jpg", {
      type: file.type,
      lastModified: file.lastModified,
    });
  } catch (error) {
    throw new Error(listingImageUserError(error));
  }
}

/**
 * Spustí čtení všech fotek ve stejném ticku — nesmí se čekat na kompresi první.
 */
export function snapshotListingImageFiles(
  files: FileList | File[],
): Promise<ListingImageSnapshotResult[]> {
  const list = Array.from(files);
  const pending = list.map(async (file): Promise<ListingImageSnapshotResult> => {
    try {
      return { ok: true, file: await snapshotListingImageFile(file) };
    } catch (error) {
      return {
        ok: false,
        name: file.name || "fotka",
        error: listingImageUserError(error),
      };
    }
  });
  return Promise.all(pending);
}
