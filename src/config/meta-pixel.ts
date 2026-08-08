/** Env `NEXT_PUBLIC_META_PIXEL_ID` — prázdný string Pixel vypne. */
export function resolveMetaPixelId(): string | null {
  const env = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
  if (!env) {
    return null;
  }
  return env;
}

export const META_PIXEL_EVENTS = {
  COMPLETE_REGISTRATION: "CompleteRegistration",
  LISTING_PUBLISHED: "ListingPublished",
} as const;

export type MetaPixelEventName =
  (typeof META_PIXEL_EVENTS)[keyof typeof META_PIXEL_EVENTS];

/** Query flag po úspěšné publikaci — klient vypálí conversion event. */
export const LISTING_PUBLISHED_QUERY = "published";

/** localStorage — ListingPublished čeká na marketing souhlas i po navigaci. */
export const PENDING_LISTING_PUBLISHED_KEY =
  "zapikolou:pending_listing_published";
export const LISTING_PUBLISHED_SENT_KEY =
  "zapikolou:listing_published_sent";

/** localStorage — fire CompleteRegistration po dokončení auth flow. */
export const PENDING_REGISTRATION_CONVERSION_KEY =
  "zapikolou:pending_registration_conversion";

/** localStorage prefix — CompleteRegistration max jednou na účet. */
export const REGISTRATION_CONVERSION_SENT_KEY =
  "zapikolou:registration_conversion_sent";

/** Query po auth nového uživatele — beacon nastaví pending conversion. */
export const REGISTERED_CONVERSION_QUERY = "registered";

/** Supabase user_metadata marker pro potvrzenou e-mailovou registraci. */
export const PENDING_REGISTRATION_METADATA_KEY =
  "registration_conversion_pending";

/** OAuth callback proběhne bezprostředně po vytvoření nového účtu. */
export const NEW_OAUTH_REGISTRATION_WINDOW_MS = 5 * 60 * 1000;
