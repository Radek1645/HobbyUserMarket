/** Detekce typu souboru podle magic bytes (ne podle klientského MIME). */

export type DetectedFileKind = "jpeg" | "png" | "webp" | "pdf" | "docx";

const MIME_TO_KIND: Record<string, DetectedFileKind> = {
  "image/jpeg": "jpeg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
};

const KIND_TO_MIME: Record<DetectedFileKind, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

export function detectFileKindFromBytes(
  bytes: Uint8Array | ArrayBuffer,
): DetectedFileKind | null {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);

  if (view.length >= 3 && view[0] === 0xff && view[1] === 0xd8 && view[2] === 0xff) {
    return "jpeg";
  }

  if (
    view.length >= 8 &&
    view[0] === 0x89 &&
    view[1] === 0x50 &&
    view[2] === 0x4e &&
    view[3] === 0x47 &&
    view[4] === 0x0d &&
    view[5] === 0x0a &&
    view[6] === 0x1a &&
    view[7] === 0x0a
  ) {
    return "png";
  }

  if (
    view.length >= 12 &&
    view[0] === 0x52 &&
    view[1] === 0x49 &&
    view[2] === 0x46 &&
    view[3] === 0x46 &&
    view[8] === 0x57 &&
    view[9] === 0x45 &&
    view[10] === 0x42 &&
    view[11] === 0x50
  ) {
    return "webp";
  }

  if (
    view.length >= 5 &&
    view[0] === 0x25 &&
    view[1] === 0x50 &&
    view[2] === 0x44 &&
    view[3] === 0x46 &&
    view[4] === 0x2d
  ) {
    return "pdf";
  }

  // DOCX = ZIP kontejner (PK\x03\x04) — heuristika, ne plná OOXML validace.
  if (
    view.length >= 4 &&
    view[0] === 0x50 &&
    view[1] === 0x4b &&
    view[2] === 0x03 &&
    view[3] === 0x04
  ) {
    return "docx";
  }

  return null;
}

export function mimeForDetectedKind(kind: DetectedFileKind): string {
  return KIND_TO_MIME[kind];
}

/** Ověří, že deklarovaný MIME odpovídá obsahu souboru. */
export function mimeMatchesMagicBytes(
  declaredMime: string,
  bytes: Uint8Array | ArrayBuffer,
): boolean {
  const expected = MIME_TO_KIND[declaredMime.toLowerCase()];
  if (!expected) return false;
  return detectFileKindFromBytes(bytes) === expected;
}
