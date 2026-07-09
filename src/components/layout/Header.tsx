"use client";

import { signOut } from "@/app/actions/auth";
import { AppLogo } from "@/components/brand/AppLogo";
import { HeaderSearch } from "@/components/layout/HeaderSearch";
import { HeaderLocationPanel } from "@/components/location/HeaderLocationPanel";
import { GTM_CTA, gtmCtaProps } from "@/config/gtm-ids";
import type { AppUser } from "@/types/auth";
import { LogOut, Menu, Plus, X, LayoutList } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";

type HeaderProps = {
  user: AppUser | null;
};

const CREATE_LISTING_CLASS =
  "flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-emerald-600 p-0 text-sm font-semibold text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-600/15 transition hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-600/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 sm:h-11 sm:w-auto sm:px-4 sm:text-[0.9375rem] md:px-6";

export function Header({ user }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const openMenu = useCallback(() => {
    if (menuCloseTimer.current) {
      clearTimeout(menuCloseTimer.current);
      menuCloseTimer.current = null;
    }
    setMenuOpen(true);
  }, []);

  const scheduleCloseMenu = useCallback(() => {
    if (menuCloseTimer.current) clearTimeout(menuCloseTimer.current);
    menuCloseTimer.current = setTimeout(() => setMenuOpen(false), 180);
  }, []);

  const toggleMenu = useCallback(() => {
    setMenuOpen((open) => !open);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [menuOpen]);

  useEffect(() => {
    return () => {
      if (menuCloseTimer.current) clearTimeout(menuCloseTimer.current);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 overflow-x-clip border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-1.5 px-3 sm:gap-2 sm:px-4">
        <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2">
          <AppLogo />

          <Suspense
            fallback={
              <div
                className="h-10 min-w-0 flex-1 rounded-full border border-gray-200 bg-gray-50"
                aria-hidden="true"
              />
            }
          >
            <HeaderSearch />
          </Suspense>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
          {user ? (
            <Link
              href="/inzerat/novy"
              {...gtmCtaProps(GTM_CTA.HEADER_CREATE_LISTING)}
              aria-label="Vytvořit inzerát přes AI"
              className={CREATE_LISTING_CLASS}
            >
              <Plus className="h-4 w-4 shrink-0" strokeWidth={2.5} />
              <span className="hidden min-[480px]:inline">
                Vytvořit inzerát přes AI
              </span>
            </Link>
          ) : (
            <Link
              href="/login?next=/inzerat/novy&message=create_listing&tab=register"
              {...gtmCtaProps(GTM_CTA.HEADER_CREATE_LISTING)}
              aria-label="Vytvořit inzerát přes AI"
              className={CREATE_LISTING_CLASS}
            >
              <Plus className="h-4 w-4 shrink-0" strokeWidth={2.5} />
              <span className="hidden min-[480px]:inline">
                Vytvořit inzerát přes AI
              </span>
            </Link>
          )}

          <HeaderLocationPanel />
        </div>

        <div
          ref={menuRef}
          className="relative shrink-0"
          onMouseEnter={openMenu}
          onMouseLeave={scheduleCloseMenu}
        >
          <button
            type="button"
            {...gtmCtaProps(GTM_CTA.HEADER_MENU_TOGGLE)}
            aria-expanded={menuOpen}
            aria-controls="header-menu-panel"
            aria-label={menuOpen ? "Zavřít menu" : "Otevřít menu"}
            onClick={toggleMenu}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-50"
          >
            {menuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>

          <nav
            id="header-menu-panel"
            aria-hidden={!menuOpen}
            className={[
              "absolute top-full right-0 z-50 mt-1 w-[min(33.333vw,20rem)] min-w-[15rem] max-w-[calc(100vw-1.5rem)]",
              "origin-top-right overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl shadow-gray-900/10",
              "transition-[transform,opacity] duration-200 ease-out",
              menuOpen
                ? "pointer-events-auto scale-100 opacity-100"
                : "pointer-events-none scale-[0.98] opacity-0",
            ].join(" ")}
            onMouseEnter={openMenu}
            onMouseLeave={scheduleCloseMenu}
          >
            <div className="px-3 py-3 sm:px-4">
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
                        {user.displayName[0]?.toUpperCase() ??
                          user.email[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {user.displayName}
                      </p>
                      <p className="truncate text-xs text-gray-500">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <Link
                    href="/moje-inzeraty"
                    {...gtmCtaProps(GTM_CTA.HEADER_MY_LISTINGS)}
                    onClick={() => setMenuOpen(false)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
                  >
                    <LayoutList className="h-4 w-4" aria-hidden="true" />
                    Správa inzerátů
                  </Link>

                  <form action={signOut}>
                    <button
                      type="submit"
                      {...gtmCtaProps(GTM_CTA.HEADER_SIGN_OUT)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Odhlásit se
                    </button>
                  </form>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link
                    href="/login"
                    {...gtmCtaProps(GTM_CTA.HEADER_SIGN_IN)}
                    onClick={() => setMenuOpen(false)}
                    className="flex w-full items-center justify-center rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
                  >
                    Přihlásit se
                  </Link>
                  <Link
                    href="/login?tab=register"
                    {...gtmCtaProps(GTM_CTA.HEADER_REGISTER)}
                    onClick={() => setMenuOpen(false)}
                    className="flex w-full items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 transition hover:bg-gray-50"
                  >
                    Registrovat
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
