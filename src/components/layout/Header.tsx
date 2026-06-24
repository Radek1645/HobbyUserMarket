"use client";

import { signInWithGoogle, signOut } from "@/app/actions/auth";
import type { AppUser } from "@/types/auth";
import { LogOut, MapPin, Menu, Search, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type HeaderProps = {
  user: AppUser | null;
};

export function Header({ user }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-2 px-3 sm:gap-3 sm:px-4">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Hledat</span>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400"
            />
            <input
              type="search"
              placeholder="Hledat inzeráty…"
              className="h-10 w-full rounded-full border border-gray-200 bg-gray-50 pr-3 pl-9 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-300 focus:bg-white focus:ring-2 focus:ring-gray-200"
            />
          </label>

          <button
            type="button"
            aria-label="Poloha (brzy)"
            title="Detekce polohy — brzy"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-600 transition hover:bg-gray-100"
          >
            <MapPin className="h-4 w-4" />
          </button>
        </div>

        <button
          type="button"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? "Zavřít menu" : "Otevřít menu"}
          onClick={() => setMenuOpen((open) => !open)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-50"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {menuOpen ? (
        <nav
          id="mobile-menu"
          className="border-t border-gray-100 bg-white px-3 py-3 sm:px-4"
        >
          {user ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-3">
                {user.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt=""
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-600">
                    {user.fullName?.[0]?.toUpperCase() ??
                      user.email[0]?.toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {user.fullName ?? "Uživatel"}
                  </p>
                  <p className="truncate text-xs text-gray-500">{user.email}</p>
                </div>
              </div>

              <form action={signOut}>
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  <LogOut className="h-4 w-4" />
                  Odhlásit se
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-2">
              <form action={signInWithGoogle.bind(null, "/")}>
                <button
                  type="submit"
                  className="flex w-full items-center justify-center rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
                >
                  Přihlásit se
                </button>
              </form>
              <p className="text-center text-xs text-gray-500">
                Nebo přejdi na{" "}
                <Link
                  href="/login"
                  className="font-medium text-gray-700 underline-offset-2 hover:underline"
                  onClick={() => setMenuOpen(false)}
                >
                  přihlašovací stránku
                </Link>
              </p>
            </div>
          )}
        </nav>
      ) : null}
    </header>
  );
}
