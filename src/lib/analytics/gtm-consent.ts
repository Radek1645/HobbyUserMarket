export type GtmConsentState = "granted" | "denied";

export type GtmConsentUpdate = {
  analytics: boolean;
  marketing: boolean;
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export const GTM_CONSENT_DENIED_DEFAULTS: Record<
  string,
  GtmConsentState | number
> = {
  analytics_storage: "denied",
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
  functionality_storage: "denied",
  personalization_storage: "denied",
  security_storage: "granted",
  wait_for_update: 500,
};

/** GTM Consent Mode vyžaduje gtag() → dataLayer.push(arguments), ne array push. */
export function ensureGtag(): void {
  window.dataLayer = window.dataLayer ?? [];

  if (typeof window.gtag === "function") {
    return;
  }

  window.gtag = function gtag(): void {
    // GTM Consent Mode parsuje push Arguments objektu — ne rest pole.
    window.dataLayer!.push(
      arguments as unknown as Record<string, unknown>, // eslint-disable-line prefer-rest-params
    );
  };
}

export function pushGtmConsentCommand(
  action: "default" | "update",
  params: Record<string, GtmConsentState | number>,
): void {
  ensureGtag();
  window.gtag!("consent", action, params);
}

/** Výchozí stav před načtením GTM — analytika i marketing vypnuté. */
export function applyDefaultGtmConsent(): void {
  pushGtmConsentCommand("default", GTM_CONSENT_DENIED_DEFAULTS);
}

/** Aktualizace po volbě v cookie liště — analytika a marketing odděleně. */
export function applyGtmConsentUpdate({
  analytics,
  marketing,
}: GtmConsentUpdate): void {
  const analyticsState: GtmConsentState = analytics ? "granted" : "denied";
  const marketingState: GtmConsentState = marketing ? "granted" : "denied";

  pushGtmConsentCommand("update", {
    analytics_storage: analyticsState,
    functionality_storage: analyticsState,
    personalization_storage: analyticsState,
    ad_storage: marketingState,
    ad_user_data: marketingState,
    ad_personalization: marketingState,
  });
}

/** Inline script — musí běžet synchronně v `<head>` před gtm.js. */
export function buildGtmConsentBootstrapScript(
  storedConsentScript: string,
): string {
  return `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent', 'default', ${JSON.stringify(GTM_CONSENT_DENIED_DEFAULTS)});
${storedConsentScript}
`.trim();
}
