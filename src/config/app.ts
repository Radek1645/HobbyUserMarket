/** Globální parametry aplikace — PRD §3, §9.3 */

export const SEARCH_RADIUS_KM = 15;

export const LISTING_DURATION_DEFAULT_DAYS = 30;
export const LISTING_DURATION_MIN_DAYS = 1;
export const LISTING_DURATION_MAX_DAYS = 365;

/** Presety pro select — žádné slidery (mobilní UX) */
export const LISTING_DURATION_PRESETS = [7, 14, 30, 60, 90, 180, 365] as const;

export const LISTING_DESCRIPTION_MIN_LENGTH = 10;
export const LISTING_DESCRIPTION_MAX_LENGTH = 1000;

/** Max. doba dopředu pro datum události */
export const EVENT_DATE_MAX_DAYS_AHEAD = 365;

export function clampListingDurationDays(days: number): number {
  return Math.min(
    LISTING_DURATION_MAX_DAYS,
    Math.max(LISTING_DURATION_MIN_DAYS, Math.round(days)),
  );
}
