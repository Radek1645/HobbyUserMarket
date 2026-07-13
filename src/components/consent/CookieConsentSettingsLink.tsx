"use client";

import { COOKIE_CONSENT_UI } from "@/config/cookie-consent";
import { useCookieConsent } from "@/components/consent/CookieConsentProvider";

const footerLinkClass =
  "text-gray-600 underline-offset-2 transition hover:text-gray-900 hover:underline";

export function CookieConsentSettingsLink() {
  const { openBanner } = useCookieConsent();

  return (
    <button
      type="button"
      onClick={openBanner}
      className={`${footerLinkClass} text-left text-sm`}
    >
      {COOKIE_CONSENT_UI.footerSettingsLabel}
    </button>
  );
}
