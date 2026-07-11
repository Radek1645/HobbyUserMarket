"use client";

import { UserProvider } from "@/components/auth/UserContext";
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
      <VisitorLocationProvider>
        <SiteNoticeBar />
        <Header user={user} />
        <main className="mx-auto w-full max-w-5xl flex-1">{children}</main>
        <CreateListingFab user={user} />
        <SiteFooter />
      </VisitorLocationProvider>
    </UserProvider>
  );
}
