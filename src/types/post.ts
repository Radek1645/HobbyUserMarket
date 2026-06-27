/** Typy pro tabulku posts — PRD §4, v3.7 */

export type CategoryType = "zbozi" | "sluzby" | "udalost";

export type PostStatus = "draft" | "active" | "archived" | "hidden" | "deleted";

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
  | "substitute";

export type PaymentStatus = "free" | "paid";

/** Řádek z public.posts (snake_case dle Supabase) */
export type PostRow = {
  id: number;
  user_id: string;
  title: string;
  description: string;
  category_type: CategoryType;
  subcategory_slug: string;
  price_type: PriceType;
  price_amount: number | null;
  condition_label: ConditionLabel;
  location_text: string;
  status: PostStatus;
  expires_at: string | null;
  listing_duration_days: number;
  event_date: string | null;
  renew_count: number;
  payment_status: PaymentStatus;
  main_image_url: string | null;
  slug: string;
  created_at: string;
  updated_at: string;
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
      | "status"
      | "listing_duration_days"
      | "event_date"
      | "main_image_url"
      | "payment_status"
    >
  >;
