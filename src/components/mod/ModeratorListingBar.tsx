"use client";

import {
  adminBlockListing,
  adminDeleteListing,
  adminRestoreListing,
} from "@/app/actions/moderation-listings";
import {
  modalCancelOutlineButtonClass,
  modalDangerButtonClass,
  modalOverlayClass,
  modalPanelClass,
} from "@/config/ui-primitives";
import { getListingEditPath, getListingPath } from "@/lib/posts/listing-path";
import { POST_STATUS } from "@/config/post-status";
import { getPostStatusReasonMessage } from "@/config/listing-status-reasons";
import type { PostStatusReasonCode } from "@/types/post";
import Link from "next/link";
import { useState } from "react";

type ModeratorListingBarProps = {
  postId: number;
  postSlug: string;
  postTitle: string;
  status: string;
  statusReasonCode: PostStatusReasonCode | null;
};

export function ModeratorListingBar({
  postId,
  postSlug,
  postTitle,
  status,
  statusReasonCode,
}: ModeratorListingBarProps) {
  const [confirmAction, setConfirmAction] = useState<
    "block" | "delete" | "restore" | null
  >(null);

  const returnPath = getListingPath(postSlug);
  const reasonMessage = getPostStatusReasonMessage(statusReasonCode);

  return (
    <>
      <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-4 text-sm text-amber-950">
        <p className="font-semibold">God Mode · moderace</p>
        <p className="mt-1 text-amber-900/90">
          {postTitle} · stav{" "}
          <span className="font-mono text-xs">{status}</span>
          {reasonMessage ? ` · ${reasonMessage}` : null}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href={getListingEditPath(postSlug)}
            className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-950 transition hover:bg-amber-100"
          >
            Upravit
          </Link>
          {status === POST_STATUS.blocked ? (
            <button
              type="button"
              onClick={() => setConfirmAction("restore")}
              className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-900 transition hover:bg-emerald-100"
            >
              Obnovit
            </button>
          ) : status !== POST_STATUS.deleted ? (
            <button
              type="button"
              onClick={() => setConfirmAction("block")}
              className="rounded-lg border border-amber-400 bg-white px-3 py-1.5 text-xs font-medium text-amber-950 transition hover:bg-amber-100"
            >
              Zablokovat
            </button>
          ) : null}
          {status !== POST_STATUS.deleted ? (
            <button
              type="button"
              onClick={() => setConfirmAction("delete")}
              className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-800 transition hover:bg-red-100"
            >
              Smazat
            </button>
          ) : null}
          <Link
            href="/mod/karantena"
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-amber-900 underline-offset-2 hover:underline"
          >
            Karanténa
          </Link>
        </div>
      </div>

      {confirmAction ? (
        <div className={modalOverlayClass} role="dialog" aria-modal="true">
          <form
            action={
              confirmAction === "block"
                ? adminBlockListing
                : confirmAction === "delete"
                  ? adminDeleteListing
                  : adminRestoreListing
            }
            className={modalPanelClass}
          >
            <input type="hidden" name="postId" value={postId} />
            <input type="hidden" name="returnPath" value={returnPath} />

            <h3 className="text-lg font-semibold text-gray-900">
              {confirmAction === "block"
                ? "Zablokovat inzerát?"
                : confirmAction === "delete"
                  ? "Smazat inzerát?"
                  : "Obnovit inzerát?"}
            </h3>
            <p className="mt-2 text-sm text-gray-600">{postTitle}</p>

            {confirmAction !== "restore" ? (
              <label className="mt-4 block text-sm">
                <span className="font-medium text-gray-700">
                  Poznámka (volitelné)
                </span>
                <textarea
                  name="reasonNote"
                  rows={3}
                  maxLength={500}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                />
              </label>
            ) : null}

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className={modalCancelOutlineButtonClass}
              >
                Zrušit
              </button>
              <button
                type="submit"
                className={
                  confirmAction === "delete"
                    ? modalDangerButtonClass
                    : modalCancelOutlineButtonClass
                }
              >
                Potvrdit
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
