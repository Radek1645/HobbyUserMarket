import { LISTING_MAX_LIFETIME_DAYS } from "@/config/listing-lifetime";

export const MY_LISTINGS_PATH = "/moje-inzeraty";

/** Query `?view=expired` — výchozí (bez parametru) je živé. */
export const MY_LISTINGS_VIEW_QUERY = "view";

/** Hidden field ve formulářích pauzy / obnovení / smazání. */
export const MY_LISTINGS_VIEW_FIELD = "listView";

export const MY_LISTINGS_VIEW = {
  live: "live",
  expired: "expired",
} as const;

export type MyListingsView =
  (typeof MY_LISTINGS_VIEW)[keyof typeof MY_LISTINGS_VIEW];

export const MY_LISTINGS_VIEW_LABEL = {
  [MY_LISTINGS_VIEW.live]: "Živé",
  [MY_LISTINGS_VIEW.expired]: "Expirované",
} as const;

export const MY_LISTINGS_LIFETIME_EXHAUSTED_BADGE = "Nelze obnovit";

export const MY_LISTINGS_LIFETIME_EXHAUSTED_NOTICE = `Maximální doba existence ${LISTING_MAX_LIFETIME_DAYS} dní od založení. Založte nový inzerát.`;

export const MY_LISTINGS_EMPTY_LIVE = "Nemáte žádný živý inzerát.";
export const MY_LISTINGS_EMPTY_EXPIRED = "Žádné expirované inzeráty.";
