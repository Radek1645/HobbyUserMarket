"use client";

import { getCompanyRegistryHint } from "@/lib/company/registry";
import { normalizeIco } from "@/lib/company/ico";

type CompanyIcoInputProps = {
  id?: string;
  name?: string;
  defaultValue?: string;
  disabled?: boolean;
};

const inputClass =
  "mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-300 focus:ring-2 focus:ring-gray-200";

export function CompanyIcoInput({
  id = "companyIco",
  name = "companyIco",
  defaultValue = "",
  disabled = false,
}: CompanyIcoInputProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        IČO <span className="font-normal text-gray-500">(volitelné)</span>
      </label>
      <input
        id={id}
        name={name}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        defaultValue={defaultValue}
        disabled={disabled}
        maxLength={8}
        placeholder="12345678"
        aria-describedby={`${id}-hint`}
        aria-autocomplete="list"
        list={`${id}-suggestions`}
        onInput={(event) => {
          const input = event.currentTarget;
          input.value = normalizeIco(input.value);
        }}
        className={inputClass}
      />
      <datalist id={`${id}-suggestions`} />
      <p id={`${id}-hint`} className="mt-1 text-xs text-gray-500">
        {getCompanyRegistryHint()} Formát: 8 číslic, kontrolní součet.
      </p>
    </div>
  );
}
