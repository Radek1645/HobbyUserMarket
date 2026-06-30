import { AppShell } from "@/components/layout/AppShell";
import { getCurrentUser } from "@/lib/auth/get-user";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HobbyUserMarket",
  description: "Lokální tržiště pro hobby uživatele",
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
        className={`${geistSans.variable} ${geistMono.variable} flex min-h-screen flex-col bg-gray-50 text-gray-900 antialiased`}
      >
        <AppShell user={user}>{children}</AppShell>
      </body>
    </html>
  );
}
