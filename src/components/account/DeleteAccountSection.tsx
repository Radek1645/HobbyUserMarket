"use client";

import { deleteMyAccount, type AccountActionState } from "@/app/actions/account";
import { GTM_CTA, gtmCtaProps } from "@/config/gtm-ids";
import { useActionState, useState } from "react";

const initialState: AccountActionState = {};

const inputClass =
  "mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-300 focus:ring-2 focus:ring-gray-200";

type DeleteAccountSectionProps = {
  email: string;
};

export function DeleteAccountSection({ email }: DeleteAccountSectionProps) {
  const [state, action, pending] = useActionState(deleteMyAccount, initialState);
  const [open, setOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [emailConfirm, setEmailConfirm] = useState("");

  const emailMatches = emailConfirm.trim().toLowerCase() === email.toLowerCase();
  const canSubmit = confirmed && emailMatches && !pending;

  return (
    <section className="rounded-2xl border border-red-200 bg-red-50/40 p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-red-900">Smazat účet</h2>
      <p className="mt-2 text-sm text-red-800/90">
        Trvale smažete přihlašovací účet a všechny aktivní inzeráty. Komentáře
        pod cizími inzeráty zůstanou jako „[smazaný účet]“. Akci nelze vrátit.
      </p>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          {...gtmCtaProps(GTM_CTA.ACCOUNT_DELETE_OPEN)}
          className="mt-4 rounded-xl border border-red-300 bg-white px-4 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-50"
        >
          Smazat účet…
        </button>
      ) : (
        <form action={action} className="mt-4 space-y-4 rounded-xl border border-red-200 bg-white p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              name="confirmDelete"
              value="1"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-300"
            />
            <span className="text-sm text-gray-700">
              Rozumím, že smazání účtu je nevratné a všechny moje inzeráty budou
              odstraněny.
            </span>
          </label>

          <div>
            <label
              htmlFor="emailConfirm"
              className="block text-sm font-medium text-gray-700"
            >
              Pro potvrzení napište svůj e-mail
            </label>
            <input
              id="emailConfirm"
              type="email"
              value={emailConfirm}
              onChange={(event) => setEmailConfirm(event.target.value)}
              autoComplete="off"
              placeholder={email}
              className={inputClass}
            />
          </div>

          {state.error ? (
            <p className="text-sm text-red-600" role="alert">
              {state.error}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={!canSubmit}
              {...gtmCtaProps(GTM_CTA.ACCOUNT_DELETE_SUBMIT)}
              className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
            >
              {pending ? "Mažu účet…" : "Trvale smazat účet"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setConfirmed(false);
                setEmailConfirm("");
              }}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Zrušit
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
