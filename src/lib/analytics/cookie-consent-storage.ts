import {
  COOKIE_CONSENT_SCHEMA_VERSION,
  COOKIE_CONSENT_STORAGE_KEY,
} from "@/config/cookie-consent";

export type CookieConsentRecord = {
  version: typeof COOKIE_CONSENT_SCHEMA_VERSION;
  analytics: boolean;
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
      typeof parsed.decidedAt !== "string"
    ) {
      return null;
    }

    return parsed as CookieConsentRecord;
  } catch {
    return null;
  }
}

export function writeCookieConsent(analytics: boolean): CookieConsentRecord {
  const record: CookieConsentRecord = {
    version: COOKIE_CONSENT_SCHEMA_VERSION,
    analytics,
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

/** Serializovaný JSON pro inline script v `<head>` (sync před GTM). */
export function buildStoredConsentScript(): string {
  return `
try {
  var raw = localStorage.getItem(${JSON.stringify(COOKIE_CONSENT_STORAGE_KEY)});
  if (raw) {
    var parsed = JSON.parse(raw);
    if (parsed && parsed.version === ${COOKIE_CONSENT_SCHEMA_VERSION} && typeof parsed.analytics === "boolean") {
      var state = parsed.analytics ? "granted" : "denied";
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(["consent", "update", {
        analytics_storage: state,
        ad_storage: state,
        ad_user_data: state,
        ad_personalization: state,
        functionality_storage: state,
        personalization_storage: state
      }]);
    }
  }
} catch (e) {}
`.trim();
}
