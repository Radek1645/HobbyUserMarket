/** Sync schválených právních textů z REVIZE_PRAVNI → docs/pravni (bez poznámek pro web). */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_DIR = path.join(ROOT, "docs", "pravni", "REVIZE_PRAVNI");
const TARGET_DIR = path.join(ROOT, "docs", "pravni");

const LAWYER_REVIEW_BLOCKQUOTE =
  /^>\s*\*\*Poznámka pro revizi právníkem:\*\*/;
const INTERNAL_NOTE_BLOCKQUOTE =
  /^>\s*\*\*Technická poznámka \(interní\):\*\*/;
const DRAFT_FOOTER =
  /^\*Draft — před publikací nechat zkontrolovat právníkem\.\*$/;

function stripLegalReviewNotes(markdown) {
  const kept = markdown.split("\n").filter((line) => {
    const trimmed = line.trim();
    return (
      !LAWYER_REVIEW_BLOCKQUOTE.test(trimmed) &&
      !INTERNAL_NOTE_BLOCKQUOTE.test(trimmed) &&
      !DRAFT_FOOTER.test(trimmed)
    );
  });

  return kept
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^\*\*Verze:\*\* Draft /m, "**Verze:** ")
    .trimEnd()
    .concat("\n");
}

const PUBLISHED_FILES = [
  "vop-fo.md",
  "vop-osvc.md",
  "balicky-inzerce-fo.md",
  "balicky-inzerce-osvc.md",
  "ochrana-osobnich-udaju-fo.md",
  "ochrana-osobnich-udaju-osvc.md",
  "podminky-inzerce.md",
  "cookies.md",
  "dsa-kontaktni-centrum.md",
];

for (const filename of PUBLISHED_FILES) {
  const sourcePath = path.join(SOURCE_DIR, filename);
  if (!existsSync(sourcePath)) {
    console.warn("skip (missing):", filename);
    continue;
  }
  const raw = readFileSync(sourcePath, "utf-8");
  writeFileSync(path.join(TARGET_DIR, filename), stripLegalReviewNotes(raw), "utf-8");
  console.log("synced:", filename);
}
