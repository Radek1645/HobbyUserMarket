"use client";

import { UserProvider } from "@/components/auth/UserContext";
import { Header } from "@/components/layout/Header";
import { SiteFooter } from "@/components/layout/SiteFooter";
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
        <Header user={user} />
        <main className="mx-auto w-full max-w-5xl flex-1">{children}</main>
        <SiteFooter />
      </VisitorLocationProvider>
    </UserProvider>
  );
}
