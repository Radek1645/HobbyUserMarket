/**
 * Absolutní životnost inzerátu od created_at (zrcadlo DB).
 * Pravda v DB: public.listing_max_lifetime_days() — viz migrace 049.
 */
export const LISTING_MAX_LIFETIME_DAYS = 365;

/** Prodloužení / obnovení — počet dní přidaných k expires_at. */
export const LISTING_EXTEND_DAYS = 30;
