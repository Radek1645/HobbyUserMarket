import type { ListingDeletionReason } from "@/types/post";

/** Důvod soft-delete majitelem — sloupec posts.deletion_reason (069). */

export const LISTING_DELETION_REASON = {
  sold_on_platform: "sold_on_platform",
  other: "other",
} as const satisfies Record<ListingDeletionReason, ListingDeletionReason>;

export type { ListingDeletionReason };

export const LISTING_DELETION_REASON_LABELS: Record<
  ListingDeletionReason,
  string
> = {
  [LISTING_DELETION_REASON.sold_on_platform]: "Prodáno na zaPikolou",
  [LISTING_DELETION_REASON.other]: "Jiné",
};

const LISTING_DELETION_REASON_SET = new Set<string>(
  Object.values(LISTING_DELETION_REASON),
);

export function isListingDeletionReason(
  value: string | null | undefined,
): value is ListingDeletionReason {
  return value != null && LISTING_DELETION_REASON_SET.has(value);
}
