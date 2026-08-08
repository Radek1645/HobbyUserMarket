import {
  COOKIE_CONSENT_SCHEMA_VERSION,
  COOKIE_CONSENT_STORAGE_KEY,
} from "@/config/cookie-consent";

export type CookieConsentRecord = {
  version: typeof COOKIE_CONSENT_SCHEMA_VERSION;
  analytics: boolean;
  marketing: boolean;
  decidedAt: string;
};

export function readCookieConsent(): CookieConsentRecord | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<CookieConsentRecord>;
    if (
      parsed.version !== COOKIE_CONSENT_SCHEMA_VERSION ||
      typeof parsed.analytics !== "boolean" ||
      typeof parsed.marketing !== "boolean" ||
      typeof parsed.decidedAt !== "string"
    ) {
      return null;
    }

    return parsed as CookieConsentRecord;
  } catch {
    return null;
  }
}

export function writeCookieConsent(
  analytics: boolean,
  marketing: boolean,
): CookieConsentRecord {
  const record: CookieConsentRecord = {
    version: COOKIE_CONSENT_SCHEMA_VERSION,
    analytics,
    marketing,
    decidedAt: new Date().toISOString(),
  };

  try {
    window.localStorage.setItem(
      COOKIE_CONSENT_STORAGE_KEY,
      JSON.stringify(record),
    );
  } catch {
    /* localStorage nedostupný — volba platí jen pro aktuální session */
  }

  return record;
}

export function clearCookieConsent(): void {
  try {
    window.localStorage.removeItem(COOKIE_CONSENT_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** Serializovaný script pro obnovu volby z localStorage (sync před GTM). */
export function buildStoredConsentScript(): string {
  return `
try {
  var raw = localStorage.getItem(${JSON.stringify(COOKIE_CONSENT_STORAGE_KEY)});
  if (raw) {
    var parsed = JSON.parse(raw);
    if (
      parsed &&
      parsed.version === ${COOKIE_CONSENT_SCHEMA_VERSION} &&
      typeof parsed.analytics === "boolean" &&
      typeof parsed.marketing === "boolean"
    ) {
      var analyticsState = parsed.analytics ? "granted" : "denied";
      var marketingState = parsed.marketing ? "granted" : "denied";
      gtag("consent", "update", {
        analytics_storage: analyticsState,
        ad_storage: marketingState,
        ad_user_data: marketingState,
        ad_personalization: marketingState,
        functionality_storage: analyticsState,
        personalization_storage: analyticsState
      });
    }
  }
} catch (e) {}
`.trim();
}
