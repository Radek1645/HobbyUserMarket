"use client";

import { useCookieConsent } from "@/components/consent/CookieConsentProvider";
import { pushVirtualPageview } from "@/lib/analytics/virtual-pageview";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";

const TITLE_SETTLE_MS = 50;

/**
 * Po client navigaci (např. karta → detail inzerátu) pošle virtual_pageview.
 * Jen při uděleném analytickém souhlasu; první hit stránky nechá na GA4 Configuration tag.
 */
function VirtualPageviewTrackerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { consent, isReady } = useCookieConsent();
  const isFirstTrackedRoute = useRef(true);
  const search = searchParams.toString();

  useEffect(() => {
    if (!isReady || !consent?.analytics) {
      return;
    }

    if (isFirstTrackedRoute.current) {
      isFirstTrackedRoute.current = false;
      return;
    }

    const pagePath = search ? `${pathname}?${search}` : pathname;
    const timeoutId = window.setTimeout(() => {
      pushVirtualPageview({ pagePath });
    }, TITLE_SETTLE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [pathname, search, consent?.analytics, isReady]);

  return null;
}

export function VirtualPageviewTracker() {
  return (
    <Suspense fallback={null}>
      <VirtualPageviewTrackerInner />
    </Suspense>
  );
}
