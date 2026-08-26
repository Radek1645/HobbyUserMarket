"use client";

import { useCookieConsent } from "@/components/consent/CookieConsentProvider";
import { GTM_LP_VIEW_EVENT } from "@/config/fb-promo-landing";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/** Jednou po analytickém souhlasu — denominátor kampaně. */
export function FbPromoViewBeacon() {
  const pathname = usePathname();
  const { consent, isReady } = useCookieConsent();
  const sentRef = useRef(false);

  useEffect(() => {
    if (sentRef.current || !isReady || !consent?.analytics) {
      return;
    }

    window.dataLayer = window.dataLayer ?? [];
    window.dataLayer.push({
      event: GTM_LP_VIEW_EVENT,
      page_path: pathname,
    });
    sentRef.current = true;
  }, [consent?.analytics, isReady, pathname]);

  return null;
}
