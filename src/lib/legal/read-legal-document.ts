import { readFile } from "node:fs/promises";
import path from "node:path";

export type LegalDocumentSlug =
  | "vop"
  | "balicky-inzerce"
  | "podminky-inzerce";

const FILE_BY_SLUG: Record<LegalDocumentSlug, string> = {
  vop: "vop.md",
  "balicky-inzerce": "balicky-inzerce.md",
  "podminky-inzerce": "podminky-inzerce.md",
};

export type LegalDocumentMeta = {
  platform?: string;
  version?: string;
  effectiveDate?: string;
};

export type LegalDocument = {
  slug: LegalDocumentSlug;
  title: string;
  meta: LegalDocumentMeta;
  /** Tělo bez hlavního H1 a meta řádků pod ním. */
  body: string;
};

function parseTitle(raw: string): string {
  const match = raw.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim() ?? "Právní dokument";
}

function parseMeta(raw: string): LegalDocumentMeta {
  const platform = raw.match(/\*\*Platforma:\*\*\s*(.+)/)?.[1]?.trim();
  const version = raw.match(/\*\*Verze:\*\*\s*(.+)/)?.[1]?.trim();
  const effectiveDate = raw.match(/\*\*Datum účinnosti:\*\*\s*(.+)/)?.[1]?.trim();
  return { platform, version, effectiveDate };
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

export async function readLegalDocument(
  slug: LegalDocumentSlug,
): Promise<LegalDocument> {
  const filename = FILE_BY_SLUG[slug];
  const filePath = path.join(process.cwd(), "docs", "pravni", filename);
  const raw = await readFile(filePath, "utf-8");

  return {
    slug,
    title: parseTitle(raw),
    meta: parseMeta(raw),
    body: stripDocumentHeader(raw),
  };
}
