export function getListingPath(slug: string): string {
  return `/inzerat/${slug}`;
}

export function getListingEditPath(slug: string): string {
  return `/inzerat/${slug}/upravit`;
}

/** Veřejný výpis aktivních inzerátů zadavatele. */
export function getAdvertiserListingsPath(nickname: string): string {
  return `/uzivatel/${encodeURIComponent(nickname)}`;
}
