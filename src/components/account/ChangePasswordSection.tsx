"use client";

import {
  changeAccountPassword,
  type AuthFormState,
} from "@/app/actions/auth";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { PASSWORD_MIN_LENGTH } from "@/config/app";
import { useActionState, useMemo, useState } from "react";

const initialState: AuthFormState = {};

function passwordStrength(password: string): {
  score: 0 | 1 | 2 | 3;
  label: string;
} {
  if (!password) return { score: 0, label: "" };
  let score = 0;
  if (password.length >= PASSWORD_MIN_LENGTH) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-ZÁ-Ž]/.test(password) && /[a-zá-ž]/.test(password)) score += 1;
  if (/\d/.test(password) || /[^A-Za-z0-9Á-žá-ž]/.test(password)) score += 1;
  const capped = Math.min(3, score) as 0 | 1 | 2 | 3;
  const labels = ["", "Slabé", "Střední", "Silné"] as const;
  return { score: capped, label: labels[capped] };
}

/** Změna hesla v nastavení — vyžaduje stávající heslo (SEC-M10). */
export function ChangePasswordSection() {
  const [state, action, pending] = useActionState(
    changeAccountPassword,
    initialState,
  );
  const [password, setPassword] = useState("");
  const strength = useMemo(() => passwordStrength(password), [password]);

  return (
    <section className="mt-6 space-y-4 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Změna hesla</h2>
        <p className="mt-1 text-sm text-gray-600">
          Po změně budete odhlášeni ze všech zařízení.
        </p>
      </div>

      <form action={action} className="space-y-4">
        <PasswordInput
          id="currentPassword"
          name="currentPassword"
          label="Stávající heslo"
          autoComplete="current-password"
        />
        <PasswordInput
          id="newPassword"
          name="password"
          label="Nové heslo"
          autoComplete="new-password"
          minLength={PASSWORD_MIN_LENGTH}
          hint={`Minimálně ${PASSWORD_MIN_LENGTH} znaků.`}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {password ? (
          <div className="space-y-1" aria-live="polite">
            <div className="flex gap-1">
              {[1, 2, 3].map((level) => (
                <span
                  key={level}
                  className={`h-1.5 flex-1 rounded-full ${
                    strength.score >= level
                      ? strength.score === 1
                        ? "bg-red-400"
                        : strength.score === 2
                          ? "bg-amber-400"
                          : "bg-emerald-500"
                      : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-gray-500">Síla hesla: {strength.label}</p>
          </div>
        ) : null}
        <PasswordInput
          id="confirmNewPassword"
          name="confirmPassword"
          label="Potvrzení nového hesla"
          autoComplete="new-password"
          minLength={PASSWORD_MIN_LENGTH}
        />

        {state.error ? (
          <p
            role="alert"
            className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {state.error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="flex w-full items-center justify-center rounded-xl bg-gray-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-6"
        >
          {pending ? "Ukládám…" : "Změnit heslo"}
        </button>
      </form>
    </section>
  );
}
