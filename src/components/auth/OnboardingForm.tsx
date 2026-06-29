"use client";

import { completeOnboarding, type AuthFormState } from "@/app/actions/auth";
import { GTM_CTA, gtmCtaProps } from "@/config/gtm-ids";
import { useActionState } from "react";

type OnboardingFormProps = {
  nextPath: string;
  email: string;
};

const initialState: AuthFormState = {};

const inputClass =
  "mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-300 focus:ring-2 focus:ring-gray-200";

export function OnboardingForm({ nextPath, email }: OnboardingFormProps) {
  const [state, action, pending] = useActionState(completeOnboarding, initialState);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={nextPath} />

      <div className="rounded-xl bg-gray-50 px-3 py-2.5 text-sm text-gray-600">
        Přihlášený účet:{" "}
        <span className="font-medium text-gray-900">{email}</span>
        <p className="mt-1 text-xs text-gray-500">
          E-mail nelze později změnit — při potřebě jiné adresy založ nový účet.
        </p>
      </div>

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
          3–30 znaků, písmena, čísla, podtržítko nebo pomlčka. Zobrazí se u tvých
          inzerátů a komentářů.
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
