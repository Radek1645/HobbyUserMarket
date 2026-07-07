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
import {
  CalendarPlus,
  Eye,
  Pause,
  Pencil,
  Play,
  Trash2,
} from "lucide-react";
import Link from "next/link";

type MyListingActionsProps = {
  postId: number;
  slug: string;
  status: PostStatus;
};

const iconButtonClass =
  "inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-600 transition hover:bg-gray-50 disabled:opacity-50";

const secondaryButtonClass =
  "inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50";

const primaryButtonClass =
  "inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-white transition disabled:opacity-50";

export function MyListingActions({ postId, slug, status }: MyListingActionsProps) {
  // 'draft' = neúspěšně publikovaný inzerát (H1) — jde doupravit a znovu odeslat.
  const canEdit =
    status === "active" || status === "hidden" || status === "draft";
  const canManage =
    status === "active" ||
    status === "hidden" ||
    status === "archived";

  if (!canEdit && !canManage) return null;

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      {status === "active" ? (
        <Link
          href={getListingPath(slug)}
          {...gtmCtaProps(GTM_CTA.MY_LISTINGS_VIEW, {
            "listing-id": postId,
          })}
          className={iconButtonClass}
          title="Náhled"
          aria-label="Náhled"
        >
          <Eye className="h-4 w-4" aria-hidden />
        </Link>
      ) : null}

      {canManage ? (
        <form action={extendListingBy30Days}>
          <input type="hidden" name="postId" value={postId} />
          <button
            type="submit"
            {...gtmCtaProps(GTM_CTA.MY_LISTINGS_EXTEND, {
              "listing-id": postId,
            })}
            className={iconButtonClass}
            title="Prodloužit o 30 dnů"
            aria-label="Prodloužit o 30 dnů"
          >
            <CalendarPlus className="h-4 w-4" aria-hidden />
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

      {status === "active" ? (
        <form action={pauseListing}>
          <input type="hidden" name="postId" value={postId} />
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

      {status === "hidden" ? (
        <form action={publishListing}>
          <input type="hidden" name="postId" value={postId} />
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

      {canManage ? (
        <form
          action={deleteListing}
          className="ml-3"
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
            className={`${iconButtonClass} text-red-600 hover:bg-red-50`}
            title="Smazat"
            aria-label="Smazat"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
        </form>
      ) : null}
    </div>
  );
}
