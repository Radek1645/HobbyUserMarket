export type GtmConsentState = "granted" | "denied";

export type GtmConsentUpdate = {
  analytics: boolean;
};

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

const CONSENT_DENIED: Record<string, GtmConsentState | number> = {
  analytics_storage: "denied",
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
  functionality_storage: "denied",
  personalization_storage: "denied",
  security_storage: "granted",
  wait_for_update: 500,
};

function pushConsentCommand(
  action: "default" | "update",
  params: Record<string, GtmConsentState | number>,
): void {
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push(["consent", action, params]);
}

/** Výchozí stav před načtením GTM — analytika vypnutá. */
export function applyDefaultGtmConsent(): void {
  pushConsentCommand("default", CONSENT_DENIED);
}

/** Aktualizace po volbě v cookie liště nebo načtení z localStorage. */
export function applyGtmConsentUpdate({ analytics }: GtmConsentUpdate): void {
  const state: GtmConsentState = analytics ? "granted" : "denied";

  pushConsentCommand("update", {
    analytics_storage: state,
    ad_storage: state,
    ad_user_data: state,
    ad_personalization: state,
    functionality_storage: state,
    personalization_storage: state,
  });
}
