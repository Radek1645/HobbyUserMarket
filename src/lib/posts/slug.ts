/** Generuje URL slug z názvu inzerátu (PRD §5.3). */
export function slugifyTitle(title: string): string {
  const base = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);

  return base || "inzerat";
}

/** Unikátní slug — suffix z timestampu při kolizi. */
export function buildPostSlug(title: string): string {
  const suffix = Date.now().toString(36).slice(-4);
  const base = slugifyTitle(title).slice(0, 190);
  return `${base}-${suffix}`;
}
