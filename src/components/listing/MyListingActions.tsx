"use client";

import {
  deleteListing,
  extendListingBy30Days,
  pauseListing,
  publishListing,
} from "@/app/actions/listing-management";
import { GTM_CTA, gtmCtaProps } from "@/config/gtm-ids";
import { getListingEditPath, getListingPath } from "@/lib/posts/listing-path";
import type { PostStatus } from "@/types/post";
import Link from "next/link";

type MyListingActionsProps = {
  postId: number;
  slug: string;
  status: PostStatus;
};

const actionButtonClass =
  "rounded-xl border px-3 py-2 text-sm font-medium transition disabled:opacity-50";

export function MyListingActions({ postId, slug, status }: MyListingActionsProps) {
  const canEdit = status === "active" || status === "hidden";
  const canManage =
    status === "active" ||
    status === "hidden" ||
    status === "archived";

  if (!canEdit && !canManage) return null;

  return (
    <div className="flex shrink-0 flex-wrap gap-2">
      {status === "active" ? (
        <Link
          href={getListingPath(slug)}
          {...gtmCtaProps(GTM_CTA.MY_LISTINGS_VIEW, {
            "listing-id": postId,
          })}
          className={`${actionButtonClass} border-gray-200 text-gray-700 hover:bg-gray-50`}
        >
          Náhled
        </Link>
      ) : null}

      {canEdit ? (
        <Link
          href={getListingEditPath(slug)}
          {...gtmCtaProps(GTM_CTA.MY_LISTINGS_EDIT, {
            "listing-id": postId,
          })}
          className={`${actionButtonClass} border-gray-900 bg-gray-900 text-white hover:bg-gray-800`}
        >
          Upravit
        </Link>
      ) : null}

      {status === "active" ? (
        <form action={pauseListing}>
          <input type="hidden" name="postId" value={postId} />
          <button
            type="submit"
            {...gtmCtaProps(GTM_CTA.MY_LISTINGS_PAUSE, {
              "listing-id": postId,
            })}
            className={`${actionButtonClass} border-amber-200 text-amber-900 hover:bg-amber-50`}
          >
            Pozastavit
          </button>
        </form>
      ) : null}

      {status === "hidden" ? (
        <form action={publishListing}>
          <input type="hidden" name="postId" value={postId} />
          <button
            type="submit"
            {...gtmCtaProps(GTM_CTA.MY_LISTINGS_PUBLISH, {
              "listing-id": postId,
            })}
            className={`${actionButtonClass} border-emerald-200 text-emerald-900 hover:bg-emerald-50`}
          >
            Zveřejnit
          </button>
        </form>
      ) : null}

      {canManage ? (
        <form action={extendListingBy30Days}>
          <input type="hidden" name="postId" value={postId} />
          <button
            type="submit"
            {...gtmCtaProps(GTM_CTA.MY_LISTINGS_EXTEND, {
              "listing-id": postId,
            })}
            className={`${actionButtonClass} border-gray-200 text-gray-700 hover:bg-gray-50`}
          >
            Prodloužit o 30 dnů
          </button>
        </form>
      ) : null}

      {canManage ? (
        <form
          action={deleteListing}
          onSubmit={(event) => {
            if (
              !window.confirm(
                "Opravdu smazat inzerát? Tuto akci nelze vrátit.",
              )
            ) {
              event.preventDefault();
            }
          }}
        >
          <input type="hidden" name="postId" value={postId} />
          <button
            type="submit"
            {...gtmCtaProps(GTM_CTA.MY_LISTINGS_DELETE, {
              "listing-id": postId,
            })}
            className={`${actionButtonClass} border-red-200 text-red-700 hover:bg-red-50`}
          >
            Smazat
          </button>
        </form>
      ) : null}
    </div>
  );
}
