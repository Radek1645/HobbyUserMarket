"use client";

import {
  COOKIE_CONSENT_LINKS,
  COOKIE_CONSENT_UI,
} from "@/config/cookie-consent";
import {
  emeraldPrimaryButtonCompactClass,
  modalCancelOutlineButtonClass,
} from "@/config/ui-primitives";
import { useCookieConsent } from "@/components/consent/CookieConsentProvider";
import Link from "next/link";

export function CookieConsentBanner() {
  const { bannerOpen, isReady, acceptAnalytics, rejectOptional } =
    useCookieConsent();

  if (!isReady || !bannerOpen) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-description"
      aria-label={COOKIE_CONSENT_UI.bannerAriaLabel}
      className="fixed inset-x-0 bottom-0 z-[90] border-t border-gray-200 bg-white/95 p-4 shadow-[0_-8px_30px_rgba(15,23,42,0.12)] backdrop-blur-sm sm:p-5"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1">
          <h2
            id="cookie-consent-title"
            className="text-base font-semibold text-gray-900"
          >
            {COOKIE_CONSENT_UI.bannerTitle}
          </h2>
          <p
            id="cookie-consent-description"
            className="mt-1 text-sm leading-relaxed text-gray-600"
          >
            {COOKIE_CONSENT_UI.bannerDescription}{" "}
            <Link
              href={COOKIE_CONSENT_LINKS.cookiesPolicy.href}
              className="font-medium text-gray-900 underline underline-offset-2"
            >
              {COOKIE_CONSENT_LINKS.cookiesPolicy.label}
            </Link>
            .
          </p>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={rejectOptional}
            className={modalCancelOutlineButtonClass}
          >
            {COOKIE_CONSENT_UI.rejectOptionalLabel}
          </button>
          <button
            type="button"
            onClick={acceptAnalytics}
            className={emeraldPrimaryButtonCompactClass}
          >
            {COOKIE_CONSENT_UI.acceptAnalyticsLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
