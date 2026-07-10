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

type RegistrationConsentFieldsProps = {
  prominent?: boolean;
};

export function RegistrationConsentFields({
  prominent = false,
}: RegistrationConsentFieldsProps) {
  const textClass = prominent ? "text-sm sm:text-base" : "text-sm";

  return (
    <fieldset className="space-y-3">
      <legend className="sr-only">Souhlasy při registraci</legend>

      <label className={`flex items-start gap-2.5 ${textClass}`}>
        <input
          type="checkbox"
          name="consent_age"
          value="1"
          required
          className={checkboxClass}
        />
        <span className={labelClass}>{LEGAL_UI.registrationAgeConsent}</span>
      </label>

      <label className={`flex items-start gap-2.5 ${textClass}`}>
        <input
          type="checkbox"
          name="consent_vop"
          value="1"
          required
          className={checkboxClass}
        />
        <span className={labelClass}>
          Souhlasím s{" "}
          <Link href={VOP_PATH} className={linkClass} target="_blank">
            {LEGAL_UI.vopLinkLabel.toLowerCase()}
          </Link>
          . Bez tohoto souhlasu účet nezaložíme.
        </span>
      </label>

      <label className={`flex items-start gap-2.5 ${textClass}`}>
        <input
          type="checkbox"
          name="consent_marketing"
          value="1"
          className={checkboxClass}
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
