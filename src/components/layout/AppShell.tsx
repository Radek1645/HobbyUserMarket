"use client";

import { RegistrationConversionBeacon } from "@/components/analytics/ConversionBeacons";
import { MetaPixelLoader } from "@/components/analytics/MetaPixelLoader";
import { VirtualPageviewTracker } from "@/components/analytics/VirtualPageviewTracker";
import { UserProvider } from "@/components/auth/UserContext";
import { CookieConsentBanner } from "@/components/consent/CookieConsentBanner";
import { CookieConsentProvider } from "@/components/consent/CookieConsentProvider";
import { CreateListingFab } from "@/components/layout/CreateListingFab";
import { Header } from "@/components/layout/Header";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteNoticeBar } from "@/components/layout/SiteNoticeBar";
import { VisitorLocationProvider } from "@/components/location/VisitorLocationProvider";
import { isFbPromoLandingPath } from "@/config/fb-promo-landing";
import type { AppUser } from "@/types/auth";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

type AppShellProps = {
  user: AppUser | null;
  children: React.ReactNode;
};

export function AppShell({ user, children }: AppShellProps) {
  const pathname = usePathname();
  const hideSiteHeader = isFbPromoLandingPath(pathname);
  const mainClassName = hideSiteHeader
    ? "w-full flex-1"
    : "mx-auto w-full max-w-5xl flex-1";

  return (
    <UserProvider user={user}>
      <CookieConsentProvider>
        <VisitorLocationProvider>
          <VirtualPageviewTracker />
          <MetaPixelLoader />
          <Suspense fallback={null}>
            <RegistrationConversionBeacon userId={user?.id ?? null} />
          </Suspense>
          <SiteNoticeBar />
          {hideSiteHeader ? null : <Header user={user} />}
          <main className={mainClassName}>{children}</main>
          <CreateListingFab user={user} />
          <SiteFooter />
          <CookieConsentBanner />
        </VisitorLocationProvider>
      </CookieConsentProvider>
    </UserProvider>
  );
}
