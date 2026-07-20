/** Generuje URL slug z názvu inzerátu (PRD §5.3). */
export function slugifyTitle(title: string): string {
  const normalized = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  // SEO: vata ze stavu/rozměru nepatří do URL (stav patří do popisu).
  const withoutFiller = normalized
    .replace(/\bcca\b/g, " ")
    .replace(/\d+([.,]\d+)?\s*mm\b/g, " ")
    .replace(/\bmalo\s+pouzivan[ye]\b/g, " ")
    .replace(/\b(super|vyborny)\s+stav\b/g, " ");

  const base = withoutFiller
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 160);

  return base || "inzerat";
}

/** Unikátní slug — suffix z timestampu při kolizi. */
export function buildPostSlug(title: string): string {
  const suffix = Date.now().toString(36).slice(-4);
  const base = slugifyTitle(title).slice(0, 190);
  return `${base}-${suffix}`;
}
