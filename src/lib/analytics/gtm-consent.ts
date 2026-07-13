export type GtmConsentState = "granted" | "denied";

export type GtmConsentUpdate = {
  analytics: boolean;
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

const GTM_CONSENT_UPDATE_KEYS = [
  "analytics_storage",
  "ad_storage",
  "ad_user_data",
  "ad_personalization",
  "functionality_storage",
  "personalization_storage",
] as const;

/** GTM Consent Mode vyžaduje gtag() → dataLayer.push(arguments), ne array push. */
export function ensureGtag(): void {
  window.dataLayer = window.dataLayer ?? [];

  if (typeof window.gtag === "function") {
    return;
  }

  window.gtag = function gtag(): void {
    // GTM Consent Mode parsuje push Arguments objektu — ne rest pole.
    // eslint-disable-next-line prefer-rest-params -- kompatibilita s gtag()
    window.dataLayer!.push(arguments as unknown as Record<string, unknown>);
  };
}

export function pushGtmConsentCommand(
  action: "default" | "update",
  params: Record<string, GtmConsentState | number>,
): void {
  ensureGtag();
  window.gtag!("consent", action, params);
}

/** Výchozí stav před načtením GTM — analytika vypnutá. */
export function applyDefaultGtmConsent(): void {
  pushGtmConsentCommand("default", GTM_CONSENT_DENIED_DEFAULTS);
}

/** Aktualizace po volbě v cookie liště. */
export function applyGtmConsentUpdate({ analytics }: GtmConsentUpdate): void {
  const state: GtmConsentState = analytics ? "granted" : "denied";
  const params = Object.fromEntries(
    GTM_CONSENT_UPDATE_KEYS.map((key) => [key, state]),
  ) as Record<string, GtmConsentState>;

  pushGtmConsentCommand("update", params);
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
