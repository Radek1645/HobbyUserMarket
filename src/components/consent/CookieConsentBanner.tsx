"use client";

import {
  COOKIE_CONSENT_BANNER_HEIGHT_CSS_VAR,
  COOKIE_CONSENT_LINKS,
  COOKIE_CONSENT_UI,
} from "@/config/cookie-consent";
import {
  emeraldPrimaryButtonCompactClass,
  modalCancelOutlineButtonClass,
} from "@/config/ui-primitives";
import { useCookieConsent } from "@/components/consent/CookieConsentProvider";
import Link from "next/link";
import { useEffect, useRef } from "react";

export function CookieConsentBanner() {
  const { bannerOpen, isReady, acceptAnalytics, rejectOptional } =
    useCookieConsent();
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bannerElement = bannerRef.current;
    if (!bannerOpen || !bannerElement) {
      document.documentElement.style.removeProperty(COOKIE_CONSENT_BANNER_HEIGHT_CSS_VAR);
      return;
    }

    function syncBannerHeight() {
      if (!bannerElement) return;
      document.documentElement.style.setProperty(
        COOKIE_CONSENT_BANNER_HEIGHT_CSS_VAR,
        `${bannerElement.offsetHeight}px`,
      );
    }

    syncBannerHeight();

    const resizeObserver = new ResizeObserver(syncBannerHeight);
    resizeObserver.observe(bannerElement);

    return () => {
      resizeObserver.disconnect();
      document.documentElement.style.removeProperty(COOKIE_CONSENT_BANNER_HEIGHT_CSS_VAR);
    };
  }, [bannerOpen]);

  if (!isReady || !bannerOpen) {
    return null;
  }

  return (
    <div
      ref={bannerRef}
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-description"
      aria-label={COOKIE_CONSENT_UI.bannerAriaLabel}
      className="fixed inset-x-0 bottom-0 z-[90] border-t border-gray-200 bg-white/95 px-4 py-3 shadow-[0_-8px_30px_rgba(15,23,42,0.12)] backdrop-blur-sm sm:p-5"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1">
          <h2
            id="cookie-consent-title"
            className="text-sm font-semibold text-gray-900 sm:text-base"
          >
            {COOKIE_CONSENT_UI.bannerTitle}
          </h2>
          <p
            id="cookie-consent-description"
            className="mt-0.5 text-[13px] leading-snug text-gray-600 sm:mt-1 sm:text-sm sm:leading-relaxed"
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

        <div className="flex shrink-0 flex-row gap-2 sm:items-center">
          <button
            type="button"
            onClick={rejectOptional}
            className={`${modalCancelOutlineButtonClass} min-w-0 flex-1 px-2.5 py-2 text-xs sm:flex-none sm:px-4 sm:text-sm`}
          >
            <span className="sm:hidden">
              {COOKIE_CONSENT_UI.rejectOptionalLabelMobile}
            </span>
            <span className="hidden sm:inline">
              {COOKIE_CONSENT_UI.rejectOptionalLabel}
            </span>
          </button>
          <button
            type="button"
            onClick={acceptAnalytics}
            className={`${emeraldPrimaryButtonCompactClass} min-w-0 flex-1 px-2.5 py-2 text-xs sm:flex-none sm:px-4 sm:text-sm`}
          >
            <span className="sm:hidden">
              {COOKIE_CONSENT_UI.acceptAnalyticsLabelMobile}
            </span>
            <span className="hidden sm:inline">
              {COOKIE_CONSENT_UI.acceptAnalyticsLabel}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
