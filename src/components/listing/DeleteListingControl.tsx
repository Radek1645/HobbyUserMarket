"use client";

import { deleteListing } from "@/app/actions/listing-management";
import {
  LISTING_DELETION_REASON,
  LISTING_DELETION_REASON_LABELS,
} from "@/config/listing-deletion-reasons";
import { GTM_CTA, gtmCtaProps, type GtmCtaId } from "@/config/gtm-ids";
import {
  emeraldPrimaryButtonCompactClass,
  modalCancelGhostButtonClass,
  modalCancelOutlineButtonClass,
  modalOverlayClass,
  modalPanelClass,
} from "@/config/ui-primitives";
import { isGoodsCategoryType } from "@/config/goods-categories";
import type { CategoryType } from "@/types/post";
import { Trash2 } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

type DeleteListingControlProps = {
  postId: number;
  categoryType: CategoryType;
  variant: "icon" | "labeled";
  gtmId?: GtmCtaId;
};

const iconButtonClass =
  "inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-red-600 transition hover:bg-red-50 disabled:opacity-50";

const labeledButtonClass =
  "inline-flex items-center justify-center rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-50";

export function DeleteListingControl({
  postId,
  categoryType,
  variant,
  gtmId = GTM_CTA.MY_LISTINGS_DELETE,
}: DeleteListingControlProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const dialogTitleId = useId();
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const askSoldOnPlatform = isGoodsCategoryType(categoryType);
  const gtmProps = gtmCtaProps(gtmId, { "listing-id": postId });

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

  const trigger =
    variant === "labeled" ? (
      <button
        type="button"
        onClick={() => setDeleteDialogOpen(true)}
        {...gtmProps}
        className={labeledButtonClass}
      >
        Smazat inzerát
      </button>
    ) : (
      <button
        type="button"
        onClick={() => setDeleteDialogOpen(true)}
        {...gtmProps}
        className={iconButtonClass}
        title="Smazat"
        aria-label="Smazat"
      >
        <Trash2 className="h-4 w-4" aria-hidden />
      </button>
    );

  if (!askSoldOnPlatform) {
    return (
      <form
        action={deleteListing}
        className={variant === "icon" ? "ml-3" : undefined}
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
        {variant === "labeled" ? (
          <button type="submit" {...gtmProps} className={labeledButtonClass}>
            Smazat inzerát
          </button>
        ) : (
          <button
            type="submit"
            {...gtmProps}
            className={iconButtonClass}
            title="Smazat"
            aria-label="Smazat"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
        )}
      </form>
    );
  }

  return (
    <>
      <span className={variant === "icon" ? "ml-3" : undefined}>{trigger}</span>

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
  );
}
