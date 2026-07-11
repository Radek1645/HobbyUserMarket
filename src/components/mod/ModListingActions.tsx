"use client";

import {
  adminBlockListing,
  adminDeleteListing,
  adminRestoreListing,
} from "@/app/actions/moderation-listings";
import { POST_STATUS } from "@/config/post-status";
import { getPostStatusReasonMessage } from "@/config/listing-status-reasons";
import { getListingPath } from "@/lib/posts/listing-path";
import type { PostStatusReasonCode } from "@/types/post";
import Link from "next/link";
import { useState } from "react";

type ModListingRow = {
  id: number;
  title: string;
  slug: string;
  status: string;
  statusReasonCode: PostStatusReasonCode | null;
  createdAt: string;
  reportCount: number;
};

type ModListingActionsProps = {
  listing: ModListingRow;
  returnPath: string;
  compact?: boolean;
};

export function ModListingActions({
  listing,
  returnPath,
  compact = false,
}: ModListingActionsProps) {
  const [pending, setPending] = useState<
    "block" | "delete" | "restore" | null
  >(null);

  if (pending) {
    const action =
      pending === "block"
        ? adminBlockListing
        : pending === "delete"
          ? adminDeleteListing
          : adminRestoreListing;

    return (
      <form action={action} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="postId" value={listing.id} />
        <input type="hidden" name="returnPath" value={returnPath} />
        <span className="text-xs text-gray-600">Potvrdit?</span>
        <button
          type="submit"
          className="rounded-lg bg-gray-900 px-2 py-1 text-xs font-medium text-white"
        >
          Ano
        </button>
        <button
          type="button"
          onClick={() => setPending(null)}
          className="rounded-lg border border-gray-200 px-2 py-1 text-xs"
        >
          Ne
        </button>
      </form>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href={getListingPath(listing.slug)}
        className="text-xs font-medium text-gray-700 underline-offset-2 hover:underline"
      >
        Detail
      </Link>
      {listing.status === POST_STATUS.blocked ? (
        <button
          type="button"
          onClick={() => setPending("restore")}
          className="rounded-lg border border-emerald-200 px-2 py-1 text-xs font-medium text-emerald-800"
        >
          Obnovit
        </button>
      ) : listing.status !== POST_STATUS.deleted ? (
        <button
          type="button"
          onClick={() => setPending("block")}
          className="rounded-lg border border-amber-200 px-2 py-1 text-xs font-medium text-amber-900"
        >
          Zablokovat
        </button>
      ) : null}
      {listing.status !== POST_STATUS.deleted ? (
        <button
          type="button"
          onClick={() => setPending("delete")}
          className="rounded-lg border border-red-200 px-2 py-1 text-xs font-medium text-red-700"
        >
          Smazat
        </button>
      ) : null}
      {!compact && listing.statusReasonCode ? (
        <span className="text-xs text-gray-500">
          {getPostStatusReasonMessage(listing.statusReasonCode)}
        </span>
      ) : null}
      {!compact && listing.reportCount > 0 ? (
        <span className="text-xs text-gray-500">
          {listing.reportCount}× nahlášeno
        </span>
      ) : null}
    </div>
  );
}

export type { ModListingRow };
