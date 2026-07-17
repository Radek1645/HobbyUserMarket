"use client";

import { VirtualPageviewTracker } from "@/components/analytics/VirtualPageviewTracker";
import { UserProvider } from "@/components/auth/UserContext";
import { CookieConsentBanner } from "@/components/consent/CookieConsentBanner";
import { CookieConsentProvider } from "@/components/consent/CookieConsentProvider";
import { CreateListingFab } from "@/components/layout/CreateListingFab";
import { Header } from "@/components/layout/Header";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteNoticeBar } from "@/components/layout/SiteNoticeBar";
import { VisitorLocationProvider } from "@/components/location/VisitorLocationProvider";
import type { AppUser } from "@/types/auth";

type AppShellProps = {
  user: AppUser | null;
  children: React.ReactNode;
};

export function AppShell({ user, children }: AppShellProps) {
  return (
    <UserProvider user={user}>
      <CookieConsentProvider>
        <VisitorLocationProvider>
          <VirtualPageviewTracker />
          <SiteNoticeBar />
          <Header user={user} />
          <main className="mx-auto w-full max-w-5xl flex-1">{children}</main>
          <CreateListingFab user={user} />
          <SiteFooter />
          <CookieConsentBanner />
        </VisitorLocationProvider>
      </CookieConsentProvider>
    </UserProvider>
  );
}
