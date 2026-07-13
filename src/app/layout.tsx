import {
  GoogleTagManagerConsentScript,
  GoogleTagManagerScript,
} from "@/components/analytics/GoogleTagManager";
import { AppShell } from "@/components/layout/AppShell";
import { SITE_DISPLAY_NAME, SITE_DESCRIPTION, SITE_SEO_TITLE } from "@/config/site";
import { getCurrentUser } from "@/lib/auth/get-user";
import { getSiteUrl } from "@/lib/supabase/env";
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: SITE_SEO_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_SEO_TITLE,
    description: SITE_DESCRIPTION,
    siteName: SITE_DISPLAY_NAME,
    locale: "cs_CZ",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html lang="cs">
      <body
        className={`${geistSans.className} flex min-h-screen flex-col bg-gray-50 text-gray-900 antialiased`}
      >
        <GoogleTagManagerConsentScript />
        <GoogleTagManagerScript />
        <AppShell user={user}>{children}</AppShell>
      </body>
    </html>
  );
}
