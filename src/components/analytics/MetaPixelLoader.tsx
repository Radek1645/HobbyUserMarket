"use client";

import { useCookieConsent } from "@/components/consent/CookieConsentProvider";
import {
  META_PIXEL_EVENTS,
  resolveMetaPixelId,
  type MetaPixelEventName,
} from "@/config/meta-pixel";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    fbq?: FbqFn;
    _fbq?: FbqFn;
  }
}

type FbqFn = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[];
  loaded: boolean;
  version: string;
  push: (...args: unknown[]) => void;
  disablePushState?: boolean;
};

const META_PIXEL_SCRIPT_ID = "meta-pixel-fbevents";

/** Oficiální stub — fronta se flushne, až fbevents.js nastaví callMethod. */
function ensureMetaPixel(pixelId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  if (!window.fbq) {
    const stub = function (...args: unknown[]) {
      if (stub.callMethod) {
        stub.callMethod(...args);
      } else {
        stub.queue.push(args);
      }
    } as FbqFn;
    stub.queue = [];
    stub.loaded = true;
    stub.version = "2.0";
    stub.push = stub;
    window.fbq = stub;
    if (!window._fbq) {
      window._fbq = stub;
    }
  }

  if (!document.getElementById(META_PIXEL_SCRIPT_ID)) {
    const script = document.createElement("script");
    script.id = META_PIXEL_SCRIPT_ID;
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(script);
  }

  window.fbq("init", pixelId);
  window.fbq("track", "PageView");
}

/** Odvolání marketing souhlasu — zastaví další trackování. */
function revokeMetaPixel(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.fbq?.("consent", "revoke");
  } catch {
    /* ignore */
  }

  const script = document.getElementById(META_PIXEL_SCRIPT_ID);
  script?.remove();

  delete window.fbq;
  delete window._fbq;
}

/** Načte Meta Pixel jen při marketingovém souhlasu; při opt-out unload. */
export function MetaPixelLoader() {
  const { consent, isReady } = useCookieConsent();
  const initializedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const pixelId = resolveMetaPixelId();

    if (!consent?.marketing || !pixelId) {
      if (initializedFor.current) {
        revokeMetaPixel();
        initializedFor.current = null;
      }
      return;
    }

    if (initializedFor.current === pixelId) {
      return;
    }

    ensureMetaPixel(pixelId);
    initializedFor.current = pixelId;
  }, [consent?.marketing, isReady]);

  return null;
}

/**
 * Conversion event — přímý `fbq` když Pixel běží; jinak dataLayer (GTM-only).
 * Nikdy obojí najednou (dvojité konverze).
 */
export function trackMetaPixelEvent(
  eventName: MetaPixelEventName,
  params?: Record<string, unknown>,
): void {
  if (typeof window === "undefined") {
    return;
  }

  if (typeof window.fbq === "function") {
    if (eventName === META_PIXEL_EVENTS.COMPLETE_REGISTRATION) {
      if (params) {
        window.fbq("track", "CompleteRegistration", params);
      } else {
        window.fbq("track", "CompleteRegistration");
      }
      return;
    }

    if (params) {
      window.fbq("trackCustom", eventName, params);
    } else {
      window.fbq("trackCustom", eventName);
    }
    return;
  }

  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({
    event:
      eventName === META_PIXEL_EVENTS.COMPLETE_REGISTRATION
        ? "registration_completed"
        : "listing_published",
    meta_event: eventName,
    ...(params ?? {}),
  });
}
