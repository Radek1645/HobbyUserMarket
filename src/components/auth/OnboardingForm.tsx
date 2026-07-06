"use client";

import { completeOnboarding, type AuthFormState } from "@/app/actions/auth";
import { CompanyIcoInput } from "@/components/auth/CompanyIcoInput";
import { GTM_CTA, gtmCtaProps } from "@/config/gtm-ids";
import { useActionState, useState } from "react";

type OnboardingFormProps = {
  nextPath: string;
  email: string;
};

const initialState: AuthFormState = {};

const inputClass =
  "mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-300 focus:ring-2 focus:ring-gray-200";

export function OnboardingForm({ nextPath, email }: OnboardingFormProps) {
  const [state, action, pending] = useActionState(completeOnboarding, initialState);
  const [isCompany, setIsCompany] = useState(false);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={nextPath} />

      <div className="rounded-xl bg-gray-50 px-3 py-2.5 text-sm text-gray-600">
        Přihlášený účet:{" "}
        <span className="font-medium text-gray-900">{email}</span>
        <p className="mt-1 text-xs text-gray-500">
          E-mail nelze později změnit — při potřebě jiné adresy založte nový účet.
        </p>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 px-3 py-3">
        <input
          type="checkbox"
          name="isCompany"
          value="true"
          checked={isCompany}
          onChange={(event) => setIsCompany(event.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-300"
        />
        <span className="text-sm text-gray-700">
          <span className="font-medium text-gray-900">Registruji se jako firma</span>
          <span className="mt-0.5 block text-xs text-gray-500">
            U inzerátů se místo přezdívky zobrazí název firmy. Přezdívku si stejně
            zvolíte pro komentáře a interní identitu.
          </span>
        </span>
      </label>

      {isCompany ? (
        <div className="space-y-4 rounded-xl border border-gray-100 bg-gray-50/80 p-3">
          <div>
            <label
              htmlFor="companyName"
              className="block text-sm font-medium text-gray-700"
            >
              Název firmy <span className="text-red-600">*</span>
            </label>
            <input
              id="companyName"
              name="companyName"
              required={isCompany}
              maxLength={150}
              autoComplete="organization"
              placeholder="např. Novák s.r.o."
              className={inputClass}
            />
          </div>
          <CompanyIcoInput />
        </div>
      ) : null}

      <div>
        <label htmlFor="nickname" className="block text-sm font-medium text-gray-700">
          Přezdívka <span className="text-red-600">*</span>
        </label>
        <input
          id="nickname"
          name="nickname"
          required
          minLength={3}
          maxLength={30}
          autoComplete="nickname"
          placeholder="např. Honza_63"
          className={inputClass}
        />
        <p className="mt-1 text-xs text-gray-500">
          {isCompany
            ? "3–30 znaků. U firem se u inzerátů zobrazí název firmy, přezdívka zůstane u komentářů."
            : "3–30 znaků, písmena, čísla, podtržítko nebo pomlčka. Zobrazí se u vašich inzerátů."}
        </p>
      </div>

      {state.error ? (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        {...gtmCtaProps(GTM_CTA.ONBOARDING_SUBMIT)}
        disabled={pending}
        className="flex w-full items-center justify-center rounded-xl bg-gray-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Ukládám…" : "Pokračovat"}
      </button>
    </form>
  );
}
