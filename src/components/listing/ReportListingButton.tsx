"use client";

import { submitListingReport } from "@/app/actions/moderation-listings";
import { REPORT_REASONS, REPORT_UI } from "@/config/reports";
import {
  modalCancelOutlineButtonClass,
  modalOverlayClass,
  modalPanelClass,
} from "@/config/ui-primitives";
import { useState } from "react";

type ReportListingButtonProps = {
  postId: number;
  postSlug: string;
  isLoggedIn: boolean;
};

export function ReportListingButton({
  postId,
  postSlug,
  isLoggedIn,
}: ReportListingButtonProps) {
  const [open, setOpen] = useState(false);

  if (!isLoggedIn) {
    return (
      <a
        href={`/login?next=${encodeURIComponent(`/inzerat/${postSlug}`)}`}
        className="text-sm font-medium text-gray-500 underline-offset-2 hover:text-gray-800 hover:underline"
      >
        {REPORT_UI.inlineButtonLabel}
      </a>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-gray-500 underline-offset-2 hover:text-gray-800 hover:underline"
      >
        {REPORT_UI.inlineButtonLabel}
      </button>

      {open ? (
        <div className={modalOverlayClass} role="dialog" aria-modal="true">
          <form
            action={submitListingReport}
            className={modalPanelClass}
            onSubmit={() => setOpen(false)}
          >
            <input type="hidden" name="postId" value={postId} />
            <input type="hidden" name="postSlug" value={postSlug} />

            <h3 className="text-lg font-semibold text-gray-900">
              {REPORT_UI.inlineButtonLabel}
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Vyberte důvod. Po třech nahlášeních od různých uživatelů se
              inzerát automaticky skryje.
            </p>

            <label className="mt-4 block text-sm">
              <span className="font-medium text-gray-700">
                {REPORT_UI.reasonLabel}
              </span>
              <select
                name="reason"
                required
                defaultValue=""
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="" disabled>
                  Vyberte důvod…
                </option>
                {REPORT_REASONS.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="mt-3 block text-sm">
              <span className="font-medium text-gray-700">
                {REPORT_UI.detailLabel}
              </span>
              <textarea
                name="detailText"
                rows={3}
                maxLength={500}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              />
            </label>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className={modalCancelOutlineButtonClass}
              >
                Zrušit
              </button>
              <button
                type="submit"
                className={modalCancelOutlineButtonClass}
              >
                Odeslat
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
