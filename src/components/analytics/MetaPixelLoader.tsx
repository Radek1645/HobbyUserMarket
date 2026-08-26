"use client";

import { useCookieConsent } from "@/components/consent/CookieConsentProvider";
import {
  FB_PROMO_CREATE_LISTING_PATH,
  FB_PROMO_LANDING_PATH,
} from "@/config/fb-promo-landing";
import {
  INITIATE_CHECKOUT_SENT_KEY,
  META_PIXEL_EVENTS,
  META_PIXEL_VIEW_CONTENT_NAME,
  PENDING_INITIATE_CHECKOUT_KEY,
  PENDING_VIEW_CONTENT_KEY,
  VIEW_CONTENT_SENT_KEY,
  resolveMetaPixelId,
} from "@/config/meta-pixel";
import {
  ensureMetaPixel,
  revokeMetaPixel,
  trackEvent,
  trackPageView,
} from "@/lib/analytics/meta-pixel";
import {
  campaignParamsToEventData,
  persistCampaignQuery,
} from "@/lib/promo/campaign-storage";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";

function readFlag(key: string): boolean {
  try {
    return sessionStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function writeFlag(key: string): void {
  try {
    sessionStorage.setItem(key, "1");
  } catch {
    /* ignore */
  }
}

function clearFlag(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

function flushPendingViewContent(): void {
  if (!readFlag(PENDING_VIEW_CONTENT_KEY) || readFlag(VIEW_CONTENT_SENT_KEY)) {
    if (readFlag(VIEW_CONTENT_SENT_KEY)) {
      clearFlag(PENDING_VIEW_CONTENT_KEY);
    }
    return;
  }

  writeFlag(VIEW_CONTENT_SENT_KEY);
  clearFlag(PENDING_VIEW_CONTENT_KEY);
  trackEvent(META_PIXEL_EVENTS.VIEW_CONTENT, {
    content_name: META_PIXEL_VIEW_CONTENT_NAME,
    ...campaignParamsToEventData(),
  });
}

function flushPendingInitiateCheckout(): void {
  if (
    !readFlag(PENDING_INITIATE_CHECKOUT_KEY) ||
    readFlag(INITIATE_CHECKOUT_SENT_KEY)
  ) {
    if (readFlag(INITIATE_CHECKOUT_SENT_KEY)) {
      clearFlag(PENDING_INITIATE_CHECKOUT_KEY);
    }
    return;
  }

  writeFlag(INITIATE_CHECKOUT_SENT_KEY);
  clearFlag(PENDING_INITIATE_CHECKOUT_KEY);
  trackEvent(META_PIXEL_EVENTS.INITIATE_CHECKOUT, {
    ...campaignParamsToEventData(),
  });
}

function MetaPixelLoaderInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { consent, isReady } = useCookieConsent();
  const initializedFor = useRef<string | null>(null);

  useEffect(() => {
    persistCampaignQuery(searchParams);
  }, [searchParams]);

  useEffect(() => {
    if (pathname === FB_PROMO_LANDING_PATH) {
      writeFlag(PENDING_VIEW_CONTENT_KEY);
    }
    if (pathname === FB_PROMO_CREATE_LISTING_PATH) {
      writeFlag(PENDING_INITIATE_CHECKOUT_KEY);
    }
  }, [pathname]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const pixelId = resolveMetaPixelId();

    if (!consent?.marketing) {
      if (initializedFor.current) {
        revokeMetaPixel();
        initializedFor.current = null;
      }
      return;
    }

    if (pixelId && initializedFor.current !== pixelId) {
      ensureMetaPixel(pixelId);
      initializedFor.current = pixelId;
    }

    if (!pixelId && initializedFor.current) {
      revokeMetaPixel();
      initializedFor.current = null;
    }

    trackPageView(pathname);
    flushPendingViewContent();
    flushPendingInitiateCheckout();
  }, [consent?.marketing, isReady, pathname]);

  return null;
}

/**
 * Načte Meta Pixel jen při marketingovém souhlasu; při opt-out unload.
 * SPA PageView, ViewContent (landing) a InitiateCheckout (/inzerat/novy).
 */
export function MetaPixelLoader() {
  return (
    <Suspense fallback={null}>
      <MetaPixelLoaderInner />
    </Suspense>
  );
}
