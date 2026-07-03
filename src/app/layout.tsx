import { AppShell } from "@/components/layout/AppShell";
import { getCurrentUser } from "@/lib/auth/get-user";
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
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
        className={`${geistSans.className} flex min-h-screen flex-col bg-gray-50 text-gray-900 antialiased`}
      >
        <AppShell user={user}>{children}</AppShell>
      </body>
    </html>
  );
}
