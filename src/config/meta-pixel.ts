/** Dataset zapikolou.cz — veřejné ID, není secret. Env přepíše; prázdný string Pixel vypne. */
export const DEFAULT_META_PIXEL_ID = "1774699993535627";

/** Env `NEXT_PUBLIC_META_PIXEL_ID` přepíše default; prázdný string Pixel vypne. */
export function resolveMetaPixelId(): string | null {
  const env = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
  if (env === "") {
    return null;
  }
  if (env) {
    return env;
  }
  return DEFAULT_META_PIXEL_ID;
}

export const META_PIXEL_EVENTS = {
  PAGE_VIEW: "PageView",
  VIEW_CONTENT: "ViewContent",
  INITIATE_CHECKOUT: "InitiateCheckout",
  LEAD: "Lead",
  COMPLETE_REGISTRATION: "CompleteRegistration",
} as const;

export type MetaPixelEventName =
  (typeof META_PIXEL_EVENTS)[keyof typeof META_PIXEL_EVENTS];

export const META_PIXEL_STANDARD_EVENTS: ReadonlySet<string> = new Set(
  Object.values(META_PIXEL_EVENTS),
);

/** GTM Custom Event názvy, když Pixel v appce neběží. */
export const META_PIXEL_DATALAYER_EVENTS = {
  PAGE_VIEW: "meta_page_view",
  VIEW_CONTENT: "meta_view_content",
  INITIATE_CHECKOUT: "meta_initiate_checkout",
  LEAD: "meta_lead",
  COMPLETE_REGISTRATION: "registration_completed",
} as const;

export const META_PIXEL_VIEW_CONTENT_NAME = "landing_fb";

/** Query flag po úspěšné publikaci — klient vypálí Lead. */
export const LISTING_PUBLISHED_QUERY = "published";

/** localStorage — Lead čeká na marketing souhlas i po navigaci. */
export const PENDING_LISTING_PUBLISHED_KEY =
  "zapikolou:pending_listing_published";
export const LISTING_PUBLISHED_SENT_KEY = "zapikolou:listing_published_sent";

/** sessionStorage — ViewContent / InitiateCheckout jednou za návštěvu. */
export const PENDING_VIEW_CONTENT_KEY = "zapikolou:pending_view_content";
export const VIEW_CONTENT_SENT_KEY = "zapikolou:view_content_sent";
export const PENDING_INITIATE_CHECKOUT_KEY =
  "zapikolou:pending_initiate_checkout";
export const INITIATE_CHECKOUT_SENT_KEY = "zapikolou:initiate_checkout_sent";

/** localStorage — UTM z prvního vstupu (přežije OAuth i e-mail v nové kartě). */
export const CAMPAIGN_ATTRIBUTION_STORAGE_KEY = "zapikolou:campaign_query";
export const CAMPAIGN_ATTRIBUTION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

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
