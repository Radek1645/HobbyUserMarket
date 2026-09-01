import {
  META_PIXEL_DATALAYER_EVENTS,
  META_PIXEL_EVENTS,
  META_PIXEL_STANDARD_EVENTS,
  resolveMetaPixelId,
  type MetaPixelEventName,
} from "@/config/meta-pixel";

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

type QueuedMetaPixelEvent = {
  eventName: MetaPixelEventName;
  params?: Record<string, unknown>;
};

const META_PIXEL_SCRIPT_ID = "meta-pixel-fbevents";
const META_PIXEL_STUB_SCRIPT_ID = "meta-pixel-fbq-stub";

/**
 * Oficiální Meta stub. fbevents.js bere frontu jen jako `arguments` + `apply`,
 * ne jako rest pole z TypeScriptu (to nechá version 2.0 a init viset v queue).
 */
const META_PIXEL_FBQ_STUB = `
!function(f){if(f.fbq)return;var n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];}(window);
`.trim();

let initializedPixelId: string | null = null;
let lastPageViewPath: string | null = null;
const pendingEvents: QueuedMetaPixelEvent[] = [];

function datalayerEventName(eventName: MetaPixelEventName): string {
  switch (eventName) {
    case META_PIXEL_EVENTS.PAGE_VIEW:
      return META_PIXEL_DATALAYER_EVENTS.PAGE_VIEW;
    case META_PIXEL_EVENTS.VIEW_CONTENT:
      return META_PIXEL_DATALAYER_EVENTS.VIEW_CONTENT;
    case META_PIXEL_EVENTS.INITIATE_CHECKOUT:
      return META_PIXEL_DATALAYER_EVENTS.INITIATE_CHECKOUT;
    case META_PIXEL_EVENTS.LEAD:
      return META_PIXEL_DATALAYER_EVENTS.LEAD;
    case META_PIXEL_EVENTS.COMPLETE_REGISTRATION:
      return META_PIXEL_DATALAYER_EVENTS.COMPLETE_REGISTRATION;
  }
}

function pushDataLayerEvent(
  eventName: MetaPixelEventName,
  params?: Record<string, unknown>,
): void {
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({
    event: datalayerEventName(eventName),
    meta_event: eventName,
    ...(params ?? {}),
  });
}

/** Skutečný fbevents.js — stub bez `callMethod` ještě neposílá. */
function isFbqReady(): boolean {
  return typeof window.fbq === "function" && Boolean(window.fbq.callMethod);
}

function sendToFbq(
  eventName: MetaPixelEventName,
  params?: Record<string, unknown>,
): void {
  const method = META_PIXEL_STANDARD_EVENTS.has(eventName)
    ? "track"
    : "trackCustom";

  if (params && Object.keys(params).length > 0) {
    window.fbq!(method, eventName, params);
    return;
  }

  window.fbq!(method, eventName);
}

function flushPendingEvents(): void {
  if (!isFbqReady()) {
    return;
  }

  const queued = pendingEvents.splice(0, pendingEvents.length);
  for (const item of queued) {
    sendToFbq(item.eventName, item.params);
  }
}

function installFbqStub(): void {
  if (window.fbq) {
    return;
  }

  const stubScript = document.createElement("script");
  stubScript.id = META_PIXEL_STUB_SCRIPT_ID;
  stubScript.textContent = META_PIXEL_FBQ_STUB;
  document.head.appendChild(stubScript);
}

function loadFbeventsScript(): void {
  const existing = document.getElementById(META_PIXEL_SCRIPT_ID);
  if (existing) {
    existing.addEventListener("load", flushPendingEvents, { once: true });
    flushPendingEvents();
    return;
  }

  const script = document.createElement("script");
  script.id = META_PIXEL_SCRIPT_ID;
  script.async = true;
  script.addEventListener("load", flushPendingEvents, { once: true });
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  const firstScript = document.getElementsByTagName("script")[0];
  if (firstScript?.parentNode) {
    firstScript.parentNode.insertBefore(script, firstScript);
  } else {
    document.head.appendChild(script);
  }
}

/**
 * Stub + fbevents.js + `init`. `autoConfig` vypnutý — eventy jdou jen přes `trackEvent`.
 */
export function ensureMetaPixel(pixelId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  installFbqStub();
  loadFbeventsScript();

  if (initializedPixelId !== pixelId) {
    // Meta: autoConfig vypnout PŘED init — jinak fbevents.js stihne
    // nasadit DOM listenery (SubscribedButtonClick) dřív, než set dorazí.
    window.fbq!("set", "autoConfig", false, pixelId);
    window.fbq!("init", pixelId);
    initializedPixelId = pixelId;
  }

  flushPendingEvents();
}

/** Odvolání marketing souhlasu — zastaví další trackování a zahodí frontu. */
export function revokeMetaPixel(): void {
  if (typeof window === "undefined") {
    return;
  }

  document.getElementById(META_PIXEL_SCRIPT_ID)?.remove();
  document.getElementById(META_PIXEL_STUB_SCRIPT_ID)?.remove();
  delete window.fbq;
  delete window._fbq;
  initializedPixelId = null;
  lastPageViewPath = null;
  pendingEvents.length = 0;
}

/**
 * Jediný vstup pro Pixel eventy. Dokud `fbq` není ready, ukládá do fronty
 * a po inicializaci (consent + fbevents.js) je pošle v původním pořadí.
 */
export function trackEvent(
  eventName: MetaPixelEventName,
  params?: Record<string, unknown>,
): void {
  if (typeof window === "undefined") {
    return;
  }

  if (!resolveMetaPixelId()) {
    pushDataLayerEvent(eventName, params);
    return;
  }

  if (isFbqReady()) {
    sendToFbq(eventName, params);
    return;
  }

  pendingEvents.push({ eventName, params });
}

/** PageView jednou na pathname — SPA navigace i StrictMode. */
export function trackPageView(pathname: string): void {
  if (lastPageViewPath === pathname) {
    return;
  }
  lastPageViewPath = pathname;
  trackEvent(META_PIXEL_EVENTS.PAGE_VIEW);
}
