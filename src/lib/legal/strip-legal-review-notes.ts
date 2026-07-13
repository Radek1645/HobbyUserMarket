/** Odstraní interní poznámky pro právní revizi — na webu se nezobrazují. */

const LAWYER_REVIEW_BLOCKQUOTE =
  /^>\s*\*\*Poznámka pro revizi právníkem:\*\*/;
const INTERNAL_NOTE_BLOCKQUOTE =
  /^>\s*\*\*Technická poznámka \(interní\):\*\*/;
const DRAFT_FOOTER =
  /^\*Draft — před publikací nechat zkontrolovat právníkem\.\*$/;

export function stripLegalReviewNotes(markdown: string): string {
  const lines = markdown.split("\n");
  const kept: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (LAWYER_REVIEW_BLOCKQUOTE.test(trimmed)) continue;
    if (INTERNAL_NOTE_BLOCKQUOTE.test(trimmed)) continue;
    if (DRAFT_FOOTER.test(trimmed)) continue;
    kept.push(line);
  }

  return kept
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^\*\*Verze:\*\* Draft /m, "**Verze:** ")
    .trimEnd()
    .concat("\n");
}
