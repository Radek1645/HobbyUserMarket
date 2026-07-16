"use client";

import { updatePassword, type AuthFormState } from "@/app/actions/auth";
import { PASSWORD_MIN_LENGTH } from "@/config/app";
import { GTM_CTA, gtmCtaProps } from "@/config/gtm-ids";
import { useActionState } from "react";
import { PasswordInput } from "@/components/auth/PasswordInput";

const initialState: AuthFormState = {};

export function SetPasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, initialState);

  return (
    <form action={action} className="space-y-4">
      <PasswordInput
        id="password"
        name="password"
        label="Nové heslo"
        autoComplete="new-password"
        minLength={PASSWORD_MIN_LENGTH}
        hint={`Minimálně ${PASSWORD_MIN_LENGTH} znaků.`}
      />
      <PasswordInput
        id="confirmPassword"
        name="confirmPassword"
        label="Potvrzení hesla"
        autoComplete="new-password"
        minLength={PASSWORD_MIN_LENGTH}
      />

      {state.error ? (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        {...gtmCtaProps(GTM_CTA.PASSWORD_RESET_SUBMIT)}
        disabled={pending}
        className="flex w-full items-center justify-center rounded-xl bg-gray-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Ukládám…" : "Nastavit heslo"}
      </button>
    </form>
  );
}
