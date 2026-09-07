"use client";

import {
  extendListingBy30Days,
  pauseListing,
  publishListing,
} from "@/app/actions/listing-management";
import {
  MY_LISTINGS_VIEW,
  MY_LISTINGS_VIEW_FIELD,
  type MyListingsView,
} from "@/config/my-listings";
import { LISTING_EXTEND_BUTTON_LABEL } from "@/config/listing-lifetime";
import { GTM_CTA, gtmCtaProps } from "@/config/gtm-ids";
import { DeleteListingControl } from "@/components/listing/DeleteListingControl";
import { canExtendListingLifetime } from "@/lib/posts/listing-lifetime";
import { getListingEditPath } from "@/lib/posts/listing-path";
import { getOwnerDisplayStatus } from "@/lib/posts/listing-status";
import type { CategoryType, PostStatus } from "@/types/post";
import { CalendarPlus, Pause, Pencil, Play } from "lucide-react";
import Link from "next/link";

type MyListingActionsProps = {
  postId: number;
  slug: string;
  status: PostStatus;
  categoryType: CategoryType;
  expiresAt: string | null;
  createdAt: string;
  listView: MyListingsView;
};

const secondaryButtonClass =
  "inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50";

const primaryButtonClass =
  "inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-white transition disabled:opacity-50";

export function MyListingActions({
  postId,
  slug,
  status,
  categoryType,
  expiresAt,
  createdAt,
  listView,
}: MyListingActionsProps) {
  const displayStatus = getOwnerDisplayStatus(status, expiresAt);

  // 'draft' = neúspěšně publikovaný inzerát (H1) — jde doupravit a znovu odeslat.
  // 'blocked' = skrytý moderací/nahlášením — ven jen přes úpravu + re-moderace.
  const canEdit =
    displayStatus === "active" ||
    displayStatus === "hidden" ||
    displayStatus === "archived" ||
    status === "draft" ||
    status === "blocked";
  const canManage =
    displayStatus === "active" ||
    displayStatus === "hidden" ||
    displayStatus === "archived";
  const canDelete =
    canManage || status === "blocked" || status === "draft";
  const isArchived = displayStatus === "archived";
  const canExtend = canExtendListingLifetime(createdAt, expiresAt);

  const listViewField = () =>
    listView === MY_LISTINGS_VIEW.expired ? (
      <input
        type="hidden"
        name={MY_LISTINGS_VIEW_FIELD}
        value={MY_LISTINGS_VIEW.expired}
      />
    ) : null;

  if (!canEdit && !canDelete) return null;

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      {canManage && canExtend ? (
        <form action={extendListingBy30Days}>
          <input type="hidden" name="postId" value={postId} />
          {listViewField()}
          <button
            type="submit"
            {...gtmCtaProps(GTM_CTA.MY_LISTINGS_EXTEND, {
              "listing-id": postId,
            })}
            className={
              isArchived
                ? `${primaryButtonClass} bg-emerald-600 hover:bg-emerald-700`
                : `${secondaryButtonClass} whitespace-nowrap`
            }
          >
            <CalendarPlus className="h-4 w-4" aria-hidden />
            {isArchived ? "Obnovit" : LISTING_EXTEND_BUTTON_LABEL}
          </button>
        </form>
      ) : null}

      {canEdit ? (
        <Link
          href={getListingEditPath(slug)}
          {...gtmCtaProps(GTM_CTA.MY_LISTINGS_EDIT, {
            "listing-id": postId,
          })}
          className={secondaryButtonClass}
        >
          <Pencil className="h-4 w-4" aria-hidden />
          Upravit
        </Link>
      ) : null}

      {displayStatus === "active" ? (
        <form action={pauseListing}>
          <input type="hidden" name="postId" value={postId} />
          {listViewField()}
          <button
            type="submit"
            {...gtmCtaProps(GTM_CTA.MY_LISTINGS_PAUSE, {
              "listing-id": postId,
            })}
            className={`${primaryButtonClass} bg-amber-500 hover:bg-amber-600`}
          >
            <Pause className="h-4 w-4" aria-hidden />
            Pozastavit
          </button>
        </form>
      ) : null}

      {displayStatus === "hidden" ? (
        <form action={publishListing}>
          <input type="hidden" name="postId" value={postId} />
          {listViewField()}
          <button
            type="submit"
            {...gtmCtaProps(GTM_CTA.MY_LISTINGS_PUBLISH, {
              "listing-id": postId,
            })}
            className={`${primaryButtonClass} bg-emerald-600 hover:bg-emerald-700`}
          >
            <Play className="h-4 w-4" aria-hidden />
            Zveřejnit
          </button>
        </form>
      ) : null}

      {canDelete ? (
        <DeleteListingControl
          postId={postId}
          categoryType={categoryType}
          variant="icon"
          listView={listView}
        />
      ) : null}
    </div>
  );
}
