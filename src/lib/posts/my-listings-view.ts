import { MY_LISTINGS_VIEW, type MyListingsView } from "@/config/my-listings";
import {
  getOwnerDisplayStatus,
  isListingExpiredOrArchived,
} from "@/lib/posts/listing-status";
import type { PostStatus } from "@/types/post";

type MyListingViewRow = {
  status: PostStatus;
  expires_at: string | null;
  updated_at: string;
};

/** Živé: aktivní dřív (bližší expirace výš), pak pauza, koncepty a blokace dolů. */
const LIVE_STATUS_RANK: Partial<Record<PostStatus, number>> = {
  active: 0,
  hidden: 1,
  draft: 2,
  blocked: 3,
};

export function parseMyListingsView(raw: unknown): MyListingsView {
  return raw === MY_LISTINGS_VIEW.expired
    ? MY_LISTINGS_VIEW.expired
    : MY_LISTINGS_VIEW.live;
}

export function isMyListingInExpiredView(
  status: PostStatus,
  expiresAt: string | null,
  now: Date = new Date(),
): boolean {
  return isListingExpiredOrArchived(status, expiresAt, now);
}

export function partitionMyListings<T extends MyListingViewRow>(
  listings: T[],
  now: Date = new Date(),
): { live: T[]; expired: T[] } {
  const live: T[] = [];
  const expired: T[] = [];
  for (const listing of listings) {
    if (isMyListingInExpiredView(listing.status, listing.expires_at, now)) {
      expired.push(listing);
    } else {
      live.push(listing);
    }
  }
  return {
    live: sortLiveMyListings(live, now),
    expired: sortExpiredMyListings(expired),
  };
}

function sortLiveMyListings<T extends MyListingViewRow>(
  listings: T[],
  now: Date,
): T[] {
  return [...listings].sort((left, right) => {
    const leftStatus = getOwnerDisplayStatus(
      left.status,
      left.expires_at,
      now,
    );
    const rightStatus = getOwnerDisplayStatus(
      right.status,
      right.expires_at,
      now,
    );
    const rankDelta =
      (LIVE_STATUS_RANK[leftStatus] ?? 9) -
      (LIVE_STATUS_RANK[rightStatus] ?? 9);
    if (rankDelta !== 0) return rankDelta;

    if (leftStatus === "active" || leftStatus === "hidden") {
      const expiryDelta =
        expiresAtSortValue(left.expires_at) -
        expiresAtSortValue(right.expires_at);
      if (expiryDelta !== 0) return expiryDelta;
    }

    return (
      new Date(right.updated_at).getTime() -
      new Date(left.updated_at).getTime()
    );
  });
}

/** Nejnovější expirace nahoru — nejpravděpodobnější Obnovit. */
function sortExpiredMyListings<T extends MyListingViewRow>(listings: T[]): T[] {
  return [...listings].sort((left, right) => {
    const leftExpiry = left.expires_at
      ? new Date(left.expires_at).getTime()
      : 0;
    const rightExpiry = right.expires_at
      ? new Date(right.expires_at).getTime()
      : 0;
    if (leftExpiry !== rightExpiry) return rightExpiry - leftExpiry;
    return (
      new Date(right.updated_at).getTime() -
      new Date(left.updated_at).getTime()
    );
  });
}

function expiresAtSortValue(expiresAt: string | null): number {
  if (!expiresAt) return Number.POSITIVE_INFINITY;
  return new Date(expiresAt).getTime();
}
