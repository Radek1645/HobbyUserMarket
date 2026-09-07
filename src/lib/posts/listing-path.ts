import {
  MY_LISTINGS_PATH,
  MY_LISTINGS_VIEW,
  MY_LISTINGS_VIEW_QUERY,
  type MyListingsView,
} from "@/config/my-listings";

export function getListingPath(slug: string): string {
  return `/inzerat/${slug}`;
}

export function getMyListingsPath(options?: {
  view?: MyListingsView;
  ok?: string;
  deleteError?: string;
  quotaError?: string;
  lifetimeError?: string;
}): string {
  const params = new URLSearchParams();
  if (options?.view === MY_LISTINGS_VIEW.expired) {
    params.set(MY_LISTINGS_VIEW_QUERY, MY_LISTINGS_VIEW.expired);
  }
  if (options?.ok) params.set("ok", options.ok);
  if (options?.deleteError) params.set("deleteError", options.deleteError);
  if (options?.quotaError) params.set("quotaError", options.quotaError);
  if (options?.lifetimeError) {
    params.set("lifetimeError", options.lifetimeError);
  }
  const query = params.toString();
  return query ? `${MY_LISTINGS_PATH}?${query}` : MY_LISTINGS_PATH;
}


export function getListingEditPath(slug: string): string {
  return `/inzerat/${slug}/upravit`;
}

/** Veřejný výpis aktivních inzerátů zadavatele. */
export function getAdvertiserListingsPath(nickname: string): string {
  return `/uzivatel/${encodeURIComponent(nickname)}`;
}
