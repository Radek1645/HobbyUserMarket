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
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/favicon-48.png", type: "image/png", sizes: "48x48" },
      { url: "/favicon-96.png", type: "image/png", sizes: "96x96" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
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
    <html lang="cs" suppressHydrationWarning>
      <body
        className={`${geistSans.className} flex min-h-screen flex-col bg-gray-50 text-gray-900 antialiased`}
        suppressHydrationWarning
      >
        <GoogleTagManagerConsentScript />
        <GoogleTagManagerScript />
        <AppShell user={user}>{children}</AppShell>
      </body>
    </html>
  );
}
