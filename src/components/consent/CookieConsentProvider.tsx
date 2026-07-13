"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  readCookieConsent,
  writeCookieConsent,
  type CookieConsentRecord,
} from "@/lib/analytics/cookie-consent-storage";
import { applyGtmConsentUpdate } from "@/lib/analytics/gtm-consent";

type CookieConsentContextValue = {
  consent: CookieConsentRecord | null;
  bannerOpen: boolean;
  isReady: boolean;
  acceptAnalytics: () => void;
  rejectOptional: () => void;
  openBanner: () => void;
};

const CookieConsentContext = createContext<CookieConsentContextValue | null>(
  null,
);

type CookieConsentProviderProps = {
  children: ReactNode;
};

export function CookieConsentProvider({ children }: CookieConsentProviderProps) {
  const [consent, setConsent] = useState<CookieConsentRecord | null>(null);
  const [bannerOpen, setBannerOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const stored = readCookieConsent();
    setConsent(stored);
    setBannerOpen(stored === null);
    setIsReady(true);
  }, []);

  const persistChoice = useCallback((analytics: boolean) => {
    const record = writeCookieConsent(analytics);
    applyGtmConsentUpdate({ analytics });
    setConsent(record);
    setBannerOpen(false);
  }, []);

  const acceptAnalytics = useCallback(() => {
    persistChoice(true);
  }, [persistChoice]);

  const rejectOptional = useCallback(() => {
    persistChoice(false);
  }, [persistChoice]);

  const openBanner = useCallback(() => {
    setBannerOpen(true);
  }, []);

  const value = useMemo(
    () => ({
      consent,
      bannerOpen,
      isReady,
      acceptAnalytics,
      rejectOptional,
      openBanner,
    }),
    [
      acceptAnalytics,
      bannerOpen,
      consent,
      isReady,
      openBanner,
      rejectOptional,
    ],
  );

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent(): CookieConsentContextValue {
  const context = useContext(CookieConsentContext);
  if (!context) {
    throw new Error("useCookieConsent must be used within CookieConsentProvider");
  }
  return context;
}
