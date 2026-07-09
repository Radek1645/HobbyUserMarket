/** Typy pro tabulku posts — PRD §4, v3.7 */

export type CategoryType =
  | "zbozi"
  | "sluzby"
  | "udalost"
  | "nemovitost"
  | "prace";

export type PostStatus =
  | "draft"
  | "active"
  | "archived"
  | "hidden"
  | "blocked"
  | "deleted";

export type PostStatusReasonCode = "reports_threshold" | "moderation";

export type PriceType =
  | "fixed"
  | "free_pickup"
  | "negotiable"
  | "exchange"
  | "offer";

export type ConditionLabel =
  | "new"
  | "like_new"
  | "used"
  | "damaged"
  | "one_time"
  | "long_term"
  | "substitute"
  | "sale"
  | "rent";

export type PaymentStatus = "free" | "paid";

/** Řádek z public.post_images */
export type PostImageRow = {
  id: string;
  post_id: number;
  storage_path: string;
  url: string;
  sort_order: number;
  is_main: boolean;
  created_at: string;
};

/** Náhled fotky pro formulář / galerii */
export type ListingImagePreview = {
  id: string;
  url: string;
  isMain: boolean;
  sortOrder: number;
};

/** Řádek z public.posts (snake_case dle Supabase) */
export type PostRow = {
  id: number;
  user_id: string;
  title: string;
  description: string;
  original_title?: string | null;
  original_description?: string | null;
  category_type: CategoryType;
  subcategory_slug: string;
  price_type: PriceType;
  price_amount: number | null;
  exchange_for: string | null;
  condition_label: ConditionLabel;
  location_text: string;
  status: PostStatus;
  status_reason_code?: PostStatusReasonCode | null;
  expires_at: string | null;
  listing_duration_days: number;
  event_date: string | null;
  renew_count: number;
  payment_status: PaymentStatus;
  main_image_url: string | null;
  slug: string;
  show_contact_email?: boolean;
  show_contact_phone?: boolean;
  contact_phone?: string | null;
  created_at: string;
  updated_at: string;
};

/** Náhled inzerátu pro homepage (RPC get_nearby_posts / get_recent_posts) */
export type PublicListingPreview = {
  id: number;
  title: string;
  description: string;
  category_type: CategoryType;
  subcategory_slug: string;
  price_type: PriceType;
  price_amount: number | null;
  location_text: string;
  slug: string;
  main_image_url: string | null;
  event_date: string | null;
  created_at: string;
  distance_km?: number | null;
  /** Vyplněno RPC get_nearby_posts — skutečně použitý rádius (adaptivní kroky). */
  effective_radius_km?: number | null;
};

/** Payload pro INSERT — expires_at nastaví DB trigger */
export type PostInsert = Pick<
  PostRow,
  | "user_id"
  | "title"
  | "description"
  | "category_type"
  | "subcategory_slug"
  | "price_type"
  | "condition_label"
  | "location_text"
  | "slug"
> &
  Partial<
    Pick<
      PostRow,
      | "price_amount"
      | "exchange_for"
      | "status"
      | "listing_duration_days"
      | "event_date"
      | "main_image_url"
      | "payment_status"
      | "show_contact_email"
      | "show_contact_phone"
      | "contact_phone"
    >
  >;
