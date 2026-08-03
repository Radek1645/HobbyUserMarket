"use client";

import {
  deleteListing,
  extendListingBy30Days,
  pauseListing,
  publishListing,
} from "@/app/actions/listing-management";
import {
  LISTING_DELETION_REASON,
  LISTING_DELETION_REASON_LABELS,
} from "@/config/listing-deletion-reasons";
import { LISTING_EXTEND_DAYS } from "@/config/listing-lifetime";
import { GTM_CTA, gtmCtaProps } from "@/config/gtm-ids";
import {
  emeraldPrimaryButtonCompactClass,
  modalCancelGhostButtonClass,
  modalCancelOutlineButtonClass,
  modalOverlayClass,
  modalPanelClass,
} from "@/config/ui-primitives";
import { canExtendListingLifetime } from "@/lib/posts/listing-lifetime";
import { getListingEditPath, getListingPath } from "@/lib/posts/listing-path";
import { getOwnerDisplayStatus } from "@/lib/posts/listing-status";
import { isGoodsCategoryType } from "@/config/goods-categories";
import type { CategoryType, PostStatus } from "@/types/post";
import {
  CalendarPlus,
  Eye,
  Pause,
  Pencil,
  Play,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

type MyListingActionsProps = {
  postId: number;
  slug: string;
  status: PostStatus;
  categoryType: CategoryType;
  expiresAt: string | null;
  createdAt: string;
};

const iconButtonClass =
  "inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-600 transition hover:bg-gray-50 disabled:opacity-50";

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
}: MyListingActionsProps) {
  const displayStatus = getOwnerDisplayStatus(status, expiresAt);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const dialogTitleId = useId();
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const askSoldOnPlatform = isGoodsCategoryType(categoryType);

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

  useEffect(() => {
    if (!deleteDialogOpen) return;

    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    cancelButtonRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setDeleteDialogOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [deleteDialogOpen]);

  if (!canEdit && !canDelete) return null;

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      {displayStatus === "active" ? (
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

      {canManage && canExtend ? (
        <form action={extendListingBy30Days}>
          <input type="hidden" name="postId" value={postId} />
          <button
            type="submit"
            {...gtmCtaProps(GTM_CTA.MY_LISTINGS_EXTEND, {
              "listing-id": postId,
            })}
            className={
              isArchived
                ? `${primaryButtonClass} bg-emerald-600 hover:bg-emerald-700`
                : iconButtonClass
            }
            title={
              isArchived
                ? "Obnovit inzerát"
                : `Prodloužit až o ${LISTING_EXTEND_DAYS} dnů`
            }
            aria-label={
              isArchived
                ? "Obnovit inzerát"
                : `Prodloužit až o ${LISTING_EXTEND_DAYS} dnů`
            }
          >
            {isArchived ? (
              <>
                <CalendarPlus className="h-4 w-4" aria-hidden />
                Obnovit
              </>
            ) : (
              <CalendarPlus className="h-4 w-4" aria-hidden />
            )}
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
        askSoldOnPlatform ? (
          <>
            <button
              type="button"
              onClick={() => setDeleteDialogOpen(true)}
              {...gtmCtaProps(GTM_CTA.MY_LISTINGS_DELETE, {
                "listing-id": postId,
              })}
              className={`ml-3 ${iconButtonClass} text-red-600 hover:bg-red-50`}
              title="Smazat"
              aria-label="Smazat"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </button>

            {deleteDialogOpen ? (
              <div className={modalOverlayClass} role="presentation">
                <button
                  type="button"
                  aria-label="Zavřít"
                  className="absolute inset-0"
                  onClick={() => setDeleteDialogOpen(false)}
                />
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby={dialogTitleId}
                  className={`relative ${modalPanelClass}`}
                >
                  <h3
                    id={dialogTitleId}
                    className="text-lg font-semibold text-gray-900"
                  >
                    Proč inzerát mažete?
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Tuto akci nelze vrátit. Inzerát zmizí z veřejného webu.
                  </p>

                  <form action={deleteListing} className="mt-5 space-y-2">
                    <input type="hidden" name="postId" value={postId} />
                    <button
                      type="submit"
                      name="deletionReason"
                      value={LISTING_DELETION_REASON.sold_on_platform}
                      className={`w-full ${emeraldPrimaryButtonCompactClass}`}
                    >
                      {
                        LISTING_DELETION_REASON_LABELS[
                          LISTING_DELETION_REASON.sold_on_platform
                        ]
                      }
                    </button>
                    <button
                      type="submit"
                      name="deletionReason"
                      value={LISTING_DELETION_REASON.other}
                      className={`w-full ${modalCancelOutlineButtonClass}`}
                    >
                      {
                        LISTING_DELETION_REASON_LABELS[
                          LISTING_DELETION_REASON.other
                        ]
                      }
                    </button>
                  </form>

                  <div className="mt-3 flex justify-end">
                    <button
                      ref={cancelButtonRef}
                      type="button"
                      onClick={() => setDeleteDialogOpen(false)}
                      className={modalCancelGhostButtonClass}
                    >
                      Zrušit
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </>
        ) : (
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
        )
      ) : null}
    </div>
  );
}
