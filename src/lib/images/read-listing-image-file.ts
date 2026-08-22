/**
 * Samsung / Android Chrome: soubor z galerie je content URI.
 * Po prvním await (nebo u druhé fotky v dávce) URI ztratí oprávnění
 * → DOMException NotReadableError („could not be read… permission problems“).
 * Foťák (`capture`) vrací blob v paměti, proto Vyfotit funguje.
 */

import { validateListingImageSourceFile } from "@/lib/posts/listing-images";

export const LISTING_IMAGE_GALLERY_READ_FAILED =
  "Fotku z galerie se nepodařilo načíst. Zkuste ji vyfotit tlačítkem Vyfotit, nebo v galerii zvolte snímek uložený v telefonu.";

export const LISTING_IMAGE_LIMIT_SKIPPED = "limit fotek";

export type ListingImagePrepareKeep = "first" | "last";

export type ListingImagePrepareResult = {
  files: File[];
  skipped: { name: string; error: string }[];
  truncated: boolean;
};

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

function fileLabel(file: File): string {
  return file.name || "fotka";
}

/**
 * 1) sync: MIME, 25 MB, kapacita flow
 * 2) souběžně: snapshot jen vybraných kandidátů
 */
export function prepareListingImageFiles(
  files: FileList | File[],
  options: { maxKeep: number; keep: ListingImagePrepareKeep },
): Promise<ListingImagePrepareResult> {
  const list = Array.from(files);
  const skipped: { name: string; error: string }[] = [];
  const valid: File[] = [];

  for (const file of list) {
    const sourceError = validateListingImageSourceFile(file);
    if (sourceError) {
      skipped.push({ name: fileLabel(file), error: sourceError });
      continue;
    }
    valid.push(file);
  }

  const maxKeep = Math.max(0, options.maxKeep);
  let truncated = false;
  let toSnapshot: File[] = valid;

  if (valid.length > maxKeep) {
    truncated = true;
    if (options.keep === "last") {
      toSnapshot = valid.slice(-maxKeep);
    } else {
      toSnapshot = valid.slice(0, maxKeep);
      for (const extra of valid.slice(maxKeep)) {
        skipped.push({
          name: fileLabel(extra),
          error: LISTING_IMAGE_LIMIT_SKIPPED,
        });
      }
    }
  }

  const pending = toSnapshot.map(async (file) => {
    try {
      return { ok: true as const, file: await snapshotListingImageFile(file) };
    } catch (error) {
      return {
        ok: false as const,
        name: fileLabel(file),
        error: listingImageUserError(error),
      };
    }
  });

  return Promise.all(pending).then((results) => {
    const filesReady: File[] = [];
    for (const result of results) {
      if (result.ok) {
        filesReady.push(result.file);
        continue;
      }
      skipped.push({ name: result.name, error: result.error });
    }
    return { files: filesReady, skipped, truncated };
  });
}
