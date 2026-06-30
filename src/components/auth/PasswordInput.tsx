"use client";

import { Eye, EyeOff } from "lucide-react";
import { useId, useState } from "react";

type PasswordInputProps = {
  id?: string;
  name: string;
  label: string;
  autoComplete?: "current-password" | "new-password";
  required?: boolean;
  minLength?: number;
  hint?: string;
  prominent?: boolean;
};

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white py-2.5 pr-10 pl-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-300 focus:ring-2 focus:ring-gray-200";

const prominentInputClass =
  "w-full rounded-xl border border-gray-200 bg-white py-3 pr-10 pl-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-300 focus:ring-2 focus:ring-gray-200 sm:py-3.5 sm:text-base";

export function PasswordInput({
  id: idProp,
  name,
  label,
  autoComplete,
  required = true,
  minLength,
  hint,
  prominent = false,
}: PasswordInputProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label
        htmlFor={id}
        className={`block font-medium text-gray-700 ${prominent ? "text-sm sm:text-base" : "text-sm"}`}
      >
        {label}
      </label>
      <div className={`relative ${prominent ? "mt-1.5" : "mt-1"}`}>
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          className={prominent ? prominentInputClass : inputClass}
        />
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          className="absolute top-1/2 right-2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
          aria-label={visible ? "Skrýt heslo" : "Zobrazit heslo"}
          aria-pressed={visible}
        >
          {visible ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>
      {hint ? <p className="mt-1 text-xs text-gray-500">{hint}</p> : null}
    </div>
  );
}
