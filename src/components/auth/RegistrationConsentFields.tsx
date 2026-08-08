"use client";

import {
  LEGAL_UI,
  MARKETING_CONSENT_PATH,
  VOP_PATH,
} from "@/config/legal";
import Link from "next/link";

const checkboxClass =
  "mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-gray-900 focus:ring-gray-300";

const labelClass = "text-sm leading-relaxed text-gray-600";

const linkClass =
  "font-medium text-gray-800 underline-offset-2 hover:text-gray-900 hover:underline";

export type RegistrationConsentValues = {
  age: boolean;
  vop: boolean;
  marketing: boolean;
};

type RegistrationConsentFieldsProps = {
  prominent?: boolean;
  /** Sdílený stav mezi Google CTA a e-mailovou registrací. */
  values?: RegistrationConsentValues;
  onChange?: (next: RegistrationConsentValues) => void;
  /**
   * false = jen UI (jména polí jdou přes skryté inputy ve formulářích).
   * default true pro onboarding / jednoduchý e-mail form.
   */
  includeInputNames?: boolean;
};

/** Skrytá pole pro odeslání souhlasů v jiném formuláři než viditelné checkboxy. */
export function RegistrationConsentHiddenInputs({
  values,
}: {
  values: RegistrationConsentValues;
}) {
  return (
    <>
      {values.age ? <input type="hidden" name="consent_age" value="1" /> : null}
      {values.vop ? <input type="hidden" name="consent_vop" value="1" /> : null}
      {values.marketing ? (
        <input type="hidden" name="consent_marketing" value="1" />
      ) : null}
    </>
  );
}

export function RegistrationConsentFields({
  prominent = false,
  values,
  onChange,
  includeInputNames = true,
}: RegistrationConsentFieldsProps) {
  const textClass = prominent ? "text-sm sm:text-base" : "text-sm";
  const controlled = Boolean(values && onChange);

  return (
    <fieldset className="space-y-3">
      <legend className="sr-only">Souhlasy při registraci</legend>

      <label className={`flex items-start gap-2.5 ${textClass}`}>
        <input
          type="checkbox"
          name={includeInputNames ? "consent_age" : undefined}
          value="1"
          required={includeInputNames}
          className={checkboxClass}
          {...(controlled
            ? {
                checked: values!.age,
                onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
                  onChange!({ ...values!, age: event.target.checked }),
              }
            : {})}
        />
        <span className={labelClass}>{LEGAL_UI.registrationAgeConsent}</span>
      </label>

      <label className={`flex items-start gap-2.5 ${textClass}`}>
        <input
          type="checkbox"
          name={includeInputNames ? "consent_vop" : undefined}
          value="1"
          required={includeInputNames}
          className={checkboxClass}
          {...(controlled
            ? {
                checked: values!.vop,
                onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
                  onChange!({ ...values!, vop: event.target.checked }),
              }
            : {})}
        />
        <span className={labelClass}>
          Souhlasím s{" "}
          <Link href={VOP_PATH} className={linkClass} target="_blank">
            {LEGAL_UI.vopLinkLabel.toLowerCase()}
          </Link>
          . Bez tohoto souhlasu účet nezaložíme. (Povinné)
        </span>
      </label>

      <label className={`flex items-start gap-2.5 ${textClass}`}>
        <input
          type="checkbox"
          name={includeInputNames ? "consent_marketing" : undefined}
          value="1"
          className={checkboxClass}
          {...(controlled
            ? {
                checked: values!.marketing,
                onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
                  onChange!({ ...values!, marketing: event.target.checked }),
              }
            : {})}
        />
        <span className={labelClass}>
          Souhlasím se{" "}
          <Link href={MARKETING_CONSENT_PATH} className={linkClass} target="_blank">
            zasíláním marketingových sdělení
          </Link>
          . Souhlas můžete kdykoli odvolat.
        </span>
      </label>
    </fieldset>
  );
}
