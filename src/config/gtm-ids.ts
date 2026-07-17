/**
 * Registr CTA identifikátorů pro GTM / GA4.
 * PRD §5.5 — hodnoty jsou stabilní API; po nasazení neměnit.
 *
 * GTM trigger: Click — všechen element matching CSS selector
 *   [data-gtm-id^="cta_"]
 * Proměnná: Click Element → atribut data-gtm-id
 * Kontext (volitelně): data-gtm-category, data-gtm-listing-id, …
 */

export const GTM_CTA = {
  // Header
  HEADER_HOME: "cta_header_home",
  HEADER_CREATE_LISTING: "cta_header_create_listing",
  FAB_CREATE_LISTING: "cta_fab_create_listing",
  HEADER_SEARCH_SUBMIT: "cta_header_search_submit",
  HEADER_LOCATION: "cta_header_location",
  HEADER_MENU_TOGGLE: "cta_header_menu_toggle",
  HEADER_SIGN_IN: "cta_header_sign_in",
  HEADER_REGISTER: "cta_header_register",
  HEADER_MY_LISTINGS: "cta_header_my_listings",
  HEADER_SIGN_OUT: "cta_header_sign_out",
  HEADER_LOGIN_PAGE: "cta_header_login_page",

  // Homepage
  HOME_CREATE_LISTING: "cta_home_create_listing",
  HOME_CREATE_LISTING_GUIDE: "cta_home_create_listing_guide",
  HOME_SIGN_IN_LINK: "cta_home_sign_in_link",
  HOME_CATEGORY_TAB: "cta_home_category_tab",
  HOME_APPLY_LOCATION: "cta_home_apply_location",
  HOME_CHANGE_LOCATION: "cta_home_change_location",
  HOME_OPEN_FILTER: "cta_home_open_filter",
  HOME_FILTER_SORT: "cta_home_filter_sort",
  HOME_FILTER_SUBCATEGORY: "cta_home_filter_subcategory",

  // Výpis / detail
  LISTING_CARD_OPEN: "cta_listing_card_open",
  DETAIL_BACK_HOME: "cta_detail_back_home",
  DETAIL_EDIT_LISTING: "cta_detail_edit_listing",
  MY_LISTINGS_EDIT: "cta_my_listings_edit",
  MY_LISTINGS_VIEW: "cta_my_listings_view",
  MY_LISTINGS_DELETE: "cta_my_listings_delete",
  MY_LISTINGS_PAUSE: "cta_my_listings_pause",
  MY_LISTINGS_PUBLISH: "cta_my_listings_publish",
  MY_LISTINGS_EXTEND: "cta_my_listings_extend",

  // Poptávkový formulář
  INQUIRY_OPEN: "cta_inquiry_open",
  INQUIRY_SUBMIT: "cta_inquiry_submit",
  INQUIRY_CANCEL: "cta_inquiry_cancel",
  INQUIRY_SEND_ANOTHER: "cta_inquiry_send_another",
  CONTACT_REVEAL: "cta_contact_reveal",

  // Založení inzerátu
  CREATE_BACK_HOME: "cta_create_back_home",
  CREATE_SELECT_CATEGORY: "cta_create_select_category",
  CREATE_STEP_CONTINUE: "cta_create_step_continue",
  CREATE_STEP_BACK: "cta_create_step_back",
  CREATE_EDIT_CATEGORY: "cta_create_edit_category",
  CREATE_PUBLISH: "cta_create_publish",
  EDIT_SAVE: "cta_edit_save",
  LISTING_IMAGE_ADD: "cta_listing_image_add",
  LISTING_IMAGE_REMOVE: "cta_listing_image_remove",
  LISTING_IMAGE_SET_MAIN: "cta_listing_image_set_main",

  // Lokalita (formulář)
  LOCATION_USE_GPS: "cta_location_use_gps",
  LOCATION_SELECT_SUGGESTION: "cta_location_select_suggestion",

  // Přílohy poptávky
  INQUIRY_ATTACHMENT_ADD: "cta_inquiry_attachment_add",
  INQUIRY_ATTACHMENT_REMOVE: "cta_inquiry_attachment_remove",

  // Auth
  LOGIN_GOOGLE: "cta_login_google",
  LOGIN_EMAIL: "cta_login_email",
  REGISTER_SUBMIT: "cta_register_submit",
  PASSWORD_RESET_REQUEST: "cta_password_reset_request",
  PASSWORD_RESET_SUBMIT: "cta_password_reset_submit",
  ONBOARDING_SUBMIT: "cta_onboarding_submit",
  AUTH_TAB_LOGIN: "cta_auth_tab_login",
  AUTH_TAB_REGISTER: "cta_auth_tab_register",
  AUTH_TAB_FORGOT: "cta_auth_tab_forgot",

  // Profil / účet
  HEADER_ACCOUNT_SETTINGS: "cta_header_account_settings",
  ACCOUNT_DELETE_OPEN: "cta_account_delete_open",
  ACCOUNT_DELETE_SUBMIT: "cta_account_delete_submit",

  // God Mode
  MOD_USER_DELETE_OPEN: "cta_mod_user_delete_open",
  MOD_USER_DELETE_SUBMIT: "cta_mod_user_delete_submit",
  MOD_USER_GRANT_PACKAGE: "cta_mod_user_grant_package",
} as const;

export type GtmCtaId = (typeof GTM_CTA)[keyof typeof GTM_CTA];

/** Všechna platná ID (validace v CI / testech). */
export const GTM_CTA_IDS: GtmCtaId[] = Object.values(GTM_CTA);

/**
 * Props pro `<button>`, `<Link>`, `<a>` — atribut `data-gtm-id` + volitelný kontext.
 * @example gtmCtaProps(GTM_CTA.HOME_CATEGORY_TAB, { category: "prace" })
 */
export function gtmCtaProps(
  id: GtmCtaId,
  context?: Record<string, string | number | undefined>,
): { "data-gtm-id": GtmCtaId } & Record<string, string> {
  const props: Record<string, string> = { "data-gtm-id": id };

  if (context) {
    for (const [key, value] of Object.entries(context)) {
      if (value !== undefined && value !== "") {
        props[`data-gtm-${key}`] = String(value);
      }
    }
  }

  return props as { "data-gtm-id": GtmCtaId } & Record<string, string>;
}
