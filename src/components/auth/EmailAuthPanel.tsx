"use client";

import {
  requestPasswordReset,
  signInWithEmail,
  signUpWithEmail,
  type AuthFormState,
} from "@/app/actions/auth";
import { GTM_CTA, gtmCtaProps } from "@/config/gtm-ids";
import { Mail } from "lucide-react";
import { useActionState, useState } from "react";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { RegistrationConsentFields } from "@/components/auth/RegistrationConsentFields";
import { BackButton } from "@/components/navigation/BackLink";

type AuthTab = "login" | "register" | "forgot";

type EmailAuthPanelProps = {
  nextPath: string;
  initialTab?: AuthTab;
  /** Větší typografie a odsazení — flow „Založit inzerát“ na desktopu. */
  prominent?: boolean;
};

const initialState: AuthFormState = {};

const inputClass =
  "mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-300 focus:ring-2 focus:ring-gray-200";

const prominentInputClass =
  "mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-300 focus:ring-2 focus:ring-gray-200 sm:py-3.5 sm:text-base";

const labelClass = "block text-sm font-medium text-gray-700";

const prominentLabelClass = "block text-sm font-medium text-gray-700 sm:text-base";

const primaryButtonClass =
  "flex w-full items-center justify-center rounded-xl bg-gray-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50";

const prominentPrimaryButtonClass =
  "flex w-full items-center justify-center rounded-xl bg-gray-900 px-4 py-3.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 sm:py-4 sm:text-base";

function AuthSuccessNotice({
  title,
  message,
  onContinue,
  continueLabel = "Přejít na přihlášení",
  prominent = false,
}: {
  title: string;
  message: string;
  onContinue?: () => void;
  continueLabel?: string;
  prominent?: boolean;
}) {
  return (
    <div
      role="status"
      className="rounded-xl border-2 border-emerald-400 bg-emerald-50 px-4 py-5 shadow-md shadow-emerald-900/10 ring-4 ring-emerald-100"
    >
      <div className="flex gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white"
          aria-hidden="true"
        >
          <Mail className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p
            className={`font-semibold text-emerald-950 ${
              prominent ? "text-lg sm:text-xl" : "text-base"
            }`}
          >
            {title}
          </p>
          <p
            className={`mt-2 leading-relaxed text-emerald-900 ${
              prominent ? "text-sm sm:text-base" : "text-sm"
            }`}
          >
            {message}
          </p>
        </div>
      </div>
      {onContinue ? (
        <button
          type="button"
          onClick={onContinue}
          className={`mt-4 w-full rounded-xl bg-emerald-700 px-4 py-3 font-medium text-white transition hover:bg-emerald-800 ${
            prominent ? "text-sm sm:text-base" : "text-sm"
          }`}
        >
          {continueLabel}
        </button>
      ) : null}
    </div>
  );
}

export function EmailAuthPanel({
  nextPath,
  initialTab = "login",
  prominent = false,
}: EmailAuthPanelProps) {
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

  const fieldInputClass = prominent ? prominentInputClass : inputClass;
  const fieldLabelClass = prominent ? prominentLabelClass : labelClass;
  const submitButtonClass = prominent ? prominentPrimaryButtonClass : primaryButtonClass;

  const registerComplete = Boolean(registerState.success);
  const resetComplete = Boolean(resetState.success);

  return (
    <div className={`space-y-4 ${prominent ? "mt-8 sm:mt-10" : "mt-6"}`}>
      <div
        className={`flex rounded-xl bg-gray-100 p-1 ${prominent ? "text-sm sm:text-base" : "text-sm"}`}
      >
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

      {tab === "register" && registerComplete && registerState.success ? (
        <AuthSuccessNotice
          prominent={prominent}
          title="Účet je vytvořený"
          message="Ověřte e-mail kliknutím na odkaz v doručené poště — bez toho se nepřihlásíte."
          onContinue={() => setTab("login")}
        />
      ) : null}

      {tab === "forgot" && resetComplete && resetState.success ? (
        <AuthSuccessNotice
          prominent={prominent}
          title="E-mail odeslán"
          message={resetState.success}
          onContinue={() => setTab("login")}
        />
      ) : null}

      {tab === "login" ? (
        <form action={loginAction} className="space-y-4">
          <input type="hidden" name="next" value={nextPath} />
          <div>
            <label htmlFor="login-email" className={fieldLabelClass}>
              E-mail
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className={fieldInputClass}
            />
          </div>
          <PasswordInput
            id="login-password"
            name="password"
            label="Heslo"
            autoComplete="current-password"
            prominent={prominent}
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
            className={submitButtonClass}
          >
            {loginPending ? "Přihlašuji…" : "Přihlásit se"}
          </button>
        </form>
      ) : null}

      {tab === "register" && !registerComplete ? (
        <form action={registerAction} className="space-y-4">
          <div>
            <label htmlFor="register-email" className={fieldLabelClass}>
              E-mail
            </label>
            <input
              id="register-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className={fieldInputClass}
            />
          </div>
          <PasswordInput
            id="register-password"
            name="password"
            label="Heslo"
            autoComplete="new-password"
            minLength={8}
            hint="Minimálně 8 znaků."
            prominent={prominent}
          />
          <p className={`text-gray-500 ${prominent ? "text-xs sm:text-sm" : "text-xs"}`}>
            Po registraci vám pošleme ověřovací odkaz. Bez něj se nepřihlásíte.
          </p>
          <RegistrationConsentFields prominent={prominent} />
          <button
            type="submit"
            {...gtmCtaProps(GTM_CTA.REGISTER_SUBMIT)}
            disabled={registerPending}
            className={submitButtonClass}
          >
            {registerPending ? "Vytvářím účet…" : "Vytvořit účet"}
          </button>
        </form>
      ) : null}

      {tab === "forgot" && !resetComplete ? (
        <form action={resetAction} className="space-y-4">
          <p className="text-sm text-gray-600">
            Zadejte e-mail účtu. Pošleme odkaz pro nastavení nového hesla.
          </p>
          <div>
            <label htmlFor="reset-email" className={fieldLabelClass}>
              E-mail
            </label>
            <input
              id="reset-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className={fieldInputClass}
            />
          </div>
          <button
            type="submit"
            {...gtmCtaProps(GTM_CTA.PASSWORD_RESET_REQUEST)}
            disabled={resetPending}
            className={submitButtonClass}
          >
            {resetPending ? "Odesílám…" : "Odeslat odkaz"}
          </button>
          <BackButton
            label="Zpět na přihlášení"
            onClick={() => setTab("login")}
            className="w-full justify-center"
          />
        </form>
      ) : null}
    </div>
  );
}
