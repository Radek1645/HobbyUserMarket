export function getListingPath(slug: string): string {
  return `/inzerat/${slug}`;
}

export function getListingEditPath(slug: string): string {
  return `/inzerat/${slug}/upravit`;
}
