import { stripLegalReviewNotes } from "@/lib/legal/strip-legal-review-notes";
import { readFile } from "node:fs/promises";
import path from "node:path";

export type VopSnapshot = {
  title: string;
  meta: {
    platform?: string;
    version?: string;
    effectiveDate?: string;
    operator?: string;
  };
  body: string;
};

function parseTitle(raw: string): string {
  const match = raw.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim() ?? "VOP";
}

function parseMeta(raw: string): VopSnapshot["meta"] {
  const platform = raw.match(/\*\*Platforma:\*\*\s*(.+)/)?.[1]?.trim();
  const version = raw.match(/\*\*Verze:\*\*\s*(.+)/)?.[1]?.trim();
  const effectiveDate = raw.match(/\*\*Datum účinnosti:\*\*\s*(.+)/)?.[1]?.trim();
  const operator =
    raw.match(/\*\*Provozovatel:\*\*\s*(.+)/)?.[1]?.trim() ??
    raw.match(/\*\*Správce:\*\*\s*(.+)/)?.[1]?.trim();
  return { platform, version, effectiveDate, operator };
}

function stripDocumentHeader(raw: string): string {
  const lines = raw.split("\n");
  let index = 0;

  if (lines[index]?.startsWith("# ")) {
    index += 1;
  }

  while (index < lines.length && lines[index]?.trim() === "") {
    index += 1;
  }

  while (index < lines.length) {
    const line = lines[index]?.trim() ?? "";
    if (
      line.startsWith("**Platforma:") ||
      line.startsWith("**Verze:") ||
      line.startsWith("**Provozovatel:") ||
      line.startsWith("**Správce:") ||
      line.startsWith("**Datum účinnosti:") ||
      line === "---"
    ) {
      index += 1;
      continue;
    }
    break;
  }

  while (index < lines.length && lines[index]?.trim() === "") {
    index += 1;
  }

  return lines.slice(index).join("\n").trim();
}

export async function readVopSnapshotByVersion(
  vopVersion: string,
): Promise<VopSnapshot | null> {
  const safe = vopVersion.trim();
  if (!/^\d+(?:\.\d+){0,2}-(fo|osvc)$/.test(safe)) {
    return null;
  }

  const filePath = path.join(
    process.cwd(),
    "docs",
    "pravni",
    "snapshots",
    `vop-v${safe}.md`,
  );

  try {
    const raw = stripLegalReviewNotes(await readFile(filePath, "utf-8"));
    return {
      title: parseTitle(raw),
      meta: parseMeta(raw),
      body: stripDocumentHeader(raw),
    };
  } catch {
    return null;
  }
}

