"use client";

import { adminGrantListingPackage } from "@/app/actions/listing-quota";
import { GTM_CTA, gtmCtaProps } from "@/config/gtm-ids";
import {
  emeraldPrimaryButtonCompactClass,
  modalCancelGhostButtonClass,
  modalOverlayClass,
  modalPanelClass,
} from "@/config/ui-primitives";
import { useState } from "react";

type AdminGrantPackageButtonProps = {
  userId: string;
  profileNo: number;
  nickname: string;
};

export function AdminGrantPackageButton({
  userId,
  profileNo,
  nickname,
}: AdminGrantPackageButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        {...gtmCtaProps(GTM_CTA.MOD_USER_GRANT_PACKAGE, {
          "profile-no": profileNo,
        })}
        className="rounded-lg border border-emerald-200 px-2.5 py-1.5 text-xs font-medium text-emerald-800 transition hover:bg-emerald-50"
      >
        +20 inzerátů
      </button>

      {open ? (
        <div
          className={modalOverlayClass}
          role="dialog"
          aria-modal="true"
          aria-labelledby={`grant-package-${userId}`}
        >
          <form
            action={adminGrantListingPackage}
            className={modalPanelClass}
          >
            <input type="hidden" name="userId" value={userId} />
            <input type="hidden" name="packageSlug" value="promo_partner" />

            <h2
              id={`grant-package-${userId}`}
              className="text-lg font-semibold text-gray-900"
            >
              Přidělit partnerský balíček
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Uživatel <strong>{nickname}</strong> (#{profileNo}) dostane
              dalších 20 lifetime publikací inzerátů.
            </p>

            <label className="mt-4 block text-sm font-medium text-gray-700">
              Poznámka (volitelné)
              <textarea
                name="note"
                rows={3}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900"
                placeholder="Např. beta tester, partner akce…"
              />
            </label>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className={modalCancelGhostButtonClass}
              >
                Zrušit
              </button>
              <button
                type="submit"
                className={emeraldPrimaryButtonCompactClass}
              >
                Přidělit balíček
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
