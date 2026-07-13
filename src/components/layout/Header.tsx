"use client";

import { signOut } from "@/app/actions/auth";
import { UserAvatar } from "@/components/account/UserAvatar";
import { AppLogo } from "@/components/brand/AppLogo";
import { HeaderSearch } from "@/components/layout/HeaderSearch";
import { HeaderLocationPanel } from "@/components/location/HeaderLocationPanel";
import { GTM_CTA, gtmCtaProps } from "@/config/gtm-ids";
import {
  createListingCtaLabel,
  headerCreateListingButtonClass,
  headerInputHeightClass,
  iconSmClass,
} from "@/config/ui-primitives";
import type { AppUser } from "@/types/auth";
import {
  LogOut,
  Menu,
  Sparkles,
  X,
  LayoutList,
  Settings,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";

type HeaderProps = {
  user: AppUser | null;
};

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
                className={`${headerInputHeightClass} min-w-0 flex-1 rounded-full border border-gray-200 bg-gray-50`}
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
              aria-label={createListingCtaLabel}
              className={headerCreateListingButtonClass}
            >
              <Sparkles
                className={`${iconSmClass} mr-2 shrink-0`}
                strokeWidth={2.5}
              />
              {createListingCtaLabel}
            </Link>
          ) : (
            <Link
              href="/login?next=/inzerat/novy&message=create_listing&tab=register"
              {...gtmCtaProps(GTM_CTA.HEADER_CREATE_LISTING)}
              aria-label={createListingCtaLabel}
              className={headerCreateListingButtonClass}
            >
              <Sparkles
                className={`${iconSmClass} mr-2 shrink-0`}
                strokeWidth={2.5}
              />
              {createListingCtaLabel}
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
                    <UserAvatar
                      avatarUrl={user.avatarUrl}
                      displayName={user.displayName}
                      email={user.email}
                    />
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

                  <Link
                    href="/profil/nastaveni"
                    {...gtmCtaProps(GTM_CTA.HEADER_ACCOUNT_SETTINGS)}
                    onClick={() => setMenuOpen(false)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    <Settings className="h-4 w-4" aria-hidden="true" />
                    Nastavení účtu
                  </Link>

                  {user.role === "admin" || user.role === "moderator" ? (
                    <>
                      <Link
                        href="/mod/karantena"
                        onClick={() => setMenuOpen(false)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-900 transition hover:bg-amber-100"
                      >
                        <Shield className="h-4 w-4" aria-hidden="true" />
                        Moderace · Karanténa
                      </Link>
                      <Link
                        href="/mod/inzeraty"
                        onClick={() => setMenuOpen(false)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-200 px-4 py-2.5 text-sm font-medium text-amber-900 transition hover:bg-amber-100"
                      >
                        Všechny inzeráty
                      </Link>
                      {user.role === "admin" ? (
                        <Link
                          href="/mod/uzivatele"
                          onClick={() => setMenuOpen(false)}
                          className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-200 px-4 py-2.5 text-sm font-medium text-amber-900 transition hover:bg-amber-100"
                        >
                          Uživatelé
                        </Link>
                      ) : null}
                    </>
                  ) : null}

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
