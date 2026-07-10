"use client";

import { adminDeleteUserAccount } from "@/app/actions/account";
import { ACCOUNT_DELETION_REASONS } from "@/config/moderation/account-deletion-reasons";
import { GTM_CTA, gtmCtaProps } from "@/config/gtm-ids";
import {
  modalCancelOutlineButtonClass,
  modalDangerButtonClass,
  modalOverlayClass,
  modalPanelClass,
} from "@/config/ui-primitives";
import type { UserRole } from "@/types/auth";
import type { ListingQuotaSnapshot } from "@/types/listing-quota";
import { useState } from "react";

export type AdminUserRow = {
  id: string;
  profileNo: number;
  nickname: string;
  email: string | null;
  role: UserRole;
  quota: ListingQuotaSnapshot | null;
  createdAt: string;
};

type AdminDeleteUserButtonProps = {
  user: AdminUserRow;
};

export function AdminDeleteUserButton({ user }: AdminDeleteUserButtonProps) {
  const [open, setOpen] = useState(false);
  const [reasonCode, setReasonCode] = useState(
    ACCOUNT_DELETION_REASONS[0]?.code ?? "",
  );
  const [reasonNote, setReasonNote] = useState("");

  if (user.role === "admin") {
    return (
      <span className="text-xs text-gray-400" title="Admin účty nelze smazat">
        chráněno
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        {...gtmCtaProps(GTM_CTA.MOD_USER_DELETE_OPEN, {
          "profile-no": user.profileNo,
        })}
        className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50"
      >
        Smazat účet
      </button>

      {open ? (
        <div
          className={modalOverlayClass}
          role="dialog"
          aria-modal="true"
          aria-labelledby={`delete-user-${user.id}`}
        >
          <form
            action={adminDeleteUserAccount}
            className={modalPanelClass}
            onSubmit={(event) => {
              if (
                !window.confirm(
                  `Opravdu smazat účet #${user.profileNo} (${user.nickname})?`,
                )
              ) {
                event.preventDefault();
              }
            }}
          >
            <input type="hidden" name="userId" value={user.id} />

            <h3
              id={`delete-user-${user.id}`}
              className="text-lg font-semibold text-gray-900"
            >
              Smazat účet #{user.profileNo}
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              {user.nickname}
              {user.email ? ` · ${user.email}` : ""}
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label
                  htmlFor={`reason-${user.id}`}
                  className="block text-sm font-medium text-gray-700"
                >
                  Důvod smazání *
                </label>
                <select
                  id={`reason-${user.id}`}
                  name="reasonCode"
                  required
                  value={reasonCode}
                  onChange={(event) => setReasonCode(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
                >
                  {ACCOUNT_DELETION_REASONS.map((reason) => (
                    <option key={reason.code} value={reason.code}>
                      {reason.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor={`note-${user.id}`}
                  className="block text-sm font-medium text-gray-700"
                >
                  Poznámka (volitelné)
                </label>
                <textarea
                  id={`note-${user.id}`}
                  name="reasonNote"
                  rows={3}
                  maxLength={500}
                  value={reasonNote}
                  onChange={(event) => setReasonNote(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
                />
              </div>
            </div>

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
                {...gtmCtaProps(GTM_CTA.MOD_USER_DELETE_SUBMIT, {
                  "profile-no": user.profileNo,
                })}
                className={modalDangerButtonClass}
              >
                Smazat účet
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
