"use client";

import {
  requestPasswordReset,
  signInWithEmail,
  signUpWithEmail,
  type AuthFormState,
} from "@/app/actions/auth";
import { GTM_CTA, gtmCtaProps } from "@/config/gtm-ids";
import { useActionState, useState } from "react";
import { PasswordInput } from "@/components/auth/PasswordInput";

type AuthTab = "login" | "register" | "forgot";

type EmailAuthPanelProps = {
  nextPath: string;
  initialTab?: AuthTab;
};

const initialState: AuthFormState = {};

const inputClass =
  "mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-300 focus:ring-2 focus:ring-gray-200";

const labelClass = "block text-sm font-medium text-gray-700";

export function EmailAuthPanel({ nextPath, initialTab = "login" }: EmailAuthPanelProps) {
  const [tab, setTab] = useState<AuthTab>(initialTab);
  const [loginState, loginAction, loginPending] = useActionState(
    signInWithEmail,
    initialState,
  );
  const [registerState, registerAction, registerPending] = useActionState(
    signUpWithEmail,
    initialState,
  );
  const [resetState, resetAction, resetPending] = useActionState(
    requestPasswordReset,
    initialState,
  );

  const state =
    tab === "login" ? loginState : tab === "register" ? registerState : resetState;

  return (
    <div className="mt-6 space-y-4">
      <div className="flex rounded-xl bg-gray-100 p-1 text-sm">
        <button
          type="button"
          {...gtmCtaProps(GTM_CTA.AUTH_TAB_LOGIN)}
          onClick={() => setTab("login")}
          className={`flex-1 rounded-lg px-3 py-2 font-medium transition ${
            tab === "login"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Přihlásit
        </button>
        <button
          type="button"
          {...gtmCtaProps(GTM_CTA.AUTH_TAB_REGISTER)}
          onClick={() => setTab("register")}
          className={`flex-1 rounded-lg px-3 py-2 font-medium transition ${
            tab === "register"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Registrace
        </button>
      </div>

      {state.error ? (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {state.success}
        </p>
      ) : null}

      {tab === "login" ? (
        <form action={loginAction} className="space-y-4">
          <input type="hidden" name="next" value={nextPath} />
          <div>
            <label htmlFor="login-email" className={labelClass}>
              E-mail
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className={inputClass}
            />
          </div>
          <PasswordInput
            id="login-password"
            name="password"
            label="Heslo"
            autoComplete="current-password"
          />
          <button
            type="button"
            {...gtmCtaProps(GTM_CTA.AUTH_TAB_FORGOT)}
            onClick={() => setTab("forgot")}
            className="text-sm text-gray-600 underline-offset-2 hover:text-gray-900 hover:underline"
          >
            Zapomenuté heslo?
          </button>
          <button
            type="submit"
            {...gtmCtaProps(GTM_CTA.LOGIN_EMAIL)}
            disabled={loginPending}
            className="flex w-full items-center justify-center rounded-xl bg-gray-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loginPending ? "Přihlašuji…" : "Přihlásit se"}
          </button>
        </form>
      ) : null}

      {tab === "register" ? (
        <form action={registerAction} className="space-y-4">
          <div>
            <label htmlFor="register-email" className={labelClass}>
              E-mail
            </label>
            <input
              id="register-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className={inputClass}
            />
          </div>
          <PasswordInput
            id="register-password"
            name="password"
            label="Heslo"
            autoComplete="new-password"
            minLength={8}
            hint="Minimálně 8 znaků."
          />
          <p className="text-xs text-gray-500">
            Po registraci ti pošleme ověřovací odkaz. Bez něj se nepřihlásíš.
          </p>
          <button
            type="submit"
            {...gtmCtaProps(GTM_CTA.REGISTER_SUBMIT)}
            disabled={registerPending}
            className="flex w-full items-center justify-center rounded-xl bg-gray-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {registerPending ? "Vytvářím účet…" : "Vytvořit účet"}
          </button>
        </form>
      ) : null}

      {tab === "forgot" ? (
        <form action={resetAction} className="space-y-4">
          <p className="text-sm text-gray-600">
            Zadej e-mail účtu. Pošleme odkaz pro nastavení nového hesla.
          </p>
          <div>
            <label htmlFor="reset-email" className={labelClass}>
              E-mail
            </label>
            <input
              id="reset-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            {...gtmCtaProps(GTM_CTA.PASSWORD_RESET_REQUEST)}
            disabled={resetPending}
            className="flex w-full items-center justify-center rounded-xl bg-gray-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {resetPending ? "Odesílám…" : "Odeslat odkaz"}
          </button>
          <button
            type="button"
            onClick={() => setTab("login")}
            className="w-full text-sm text-gray-600 underline-offset-2 hover:text-gray-900 hover:underline"
          >
            ← Zpět na přihlášení
          </button>
        </form>
      ) : null}
    </div>
  );
}
