import { MONETIZATION_ENABLED } from "@/config/monetization";
import { stripLegalReviewNotes } from "@/lib/legal/strip-legal-review-notes";
import { readFile } from "node:fs/promises";
import path from "node:path";

export type LegalDocumentSlug =
  | "vop"
  | "balicky-inzerce"
  | "podminky-inzerce";

const STATIC_FILE_BY_SLUG: Partial<Record<LegalDocumentSlug, string>> = {
  "podminky-inzerce": "podminky-inzerce.md",
};

const VARIANT_FILE_BY_SLUG: Partial<
  Record<LegalDocumentSlug, { fo: string; osvc: string }>
> = {
  vop: { fo: "vop-fo.md", osvc: "vop-osvc.md" },
  "balicky-inzerce": {
    fo: "balicky-inzerce-fo.md",
    osvc: "balicky-inzerce-osvc.md",
  },
};

export type LegalDocumentMeta = {
  platform?: string;
  version?: string;
  effectiveDate?: string;
  operator?: string;
};

export type LegalDocument = {
  slug: LegalDocumentSlug;
  title: string;
  meta: LegalDocumentMeta;
  /** Tělo bez hlavního H1 a meta řádků pod ním. */
  body: string;
};

function resolveFilename(slug: LegalDocumentSlug): string {
  const variants = VARIANT_FILE_BY_SLUG[slug];
  if (variants) {
    return MONETIZATION_ENABLED ? variants.osvc : variants.fo;
  }
  return STATIC_FILE_BY_SLUG[slug]!;
}

function parseTitle(raw: string): string {
  const match = raw.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim() ?? "Právní dokument";
}

function parseMeta(raw: string): LegalDocumentMeta {
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

export async function readLegalDocument(
  slug: LegalDocumentSlug,
): Promise<LegalDocument> {
  const filename = resolveFilename(slug);
  const filePath = path.join(process.cwd(), "docs", "pravni", filename);
  const raw = stripLegalReviewNotes(await readFile(filePath, "utf-8"));

  return {
    slug,
    title: parseTitle(raw),
    meta: parseMeta(raw),
    body: stripDocumentHeader(raw),
  };
}

/** Cesta k souboru GDPR zásad — stejná logika jako u VOP (FO / OSVČ). */
export function resolveGdprDocumentFilename(): string {
  return MONETIZATION_ENABLED
    ? "ochrana-osobnich-udaju-osvc.md"
    : "ochrana-osobnich-udaju-fo.md";
}
