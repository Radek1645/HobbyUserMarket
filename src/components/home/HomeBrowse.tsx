"use client";

import { useCurrentUser } from "@/components/auth/UserContext";
import { HomeListings } from "@/components/home/HomeListings";
import { GTM_CTA, gtmCtaProps } from "@/config/gtm-ids";
import {
  HOME_CATEGORY_ORDER,
  HOME_THEMES,
  parseHomeBrowseCategory,
  type HomeBrowseCategory,
} from "@/config/home-themes";
import { normalizeSearchQuery } from "@/lib/posts/search-query";
import type { PublicListingPreview } from "@/types/post";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

type HomeBrowseProps = {
  initialListings?: PublicListingPreview[] | null;
  initialListingsCategory?: HomeBrowseCategory | null;
};

export function HomeBrowse({
  initialListings = null,
  initialListingsCategory = null,
}: HomeBrowseProps) {
  const user = useCurrentUser();
  const router = useRouter();
  const searchParams = useSearchParams();

  const category = useMemo(
    () => parseHomeBrowseCategory(searchParams.get("kategorie")),
    [searchParams],
  );

  const searchQuery = useMemo(
    () => normalizeSearchQuery(searchParams.get("q")),
    [searchParams],
  );

  const theme = HOME_THEMES[category];

  const setCategory = useCallback(
    (next: HomeBrowseCategory) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === "all") {
        params.delete("kategorie");
      } else {
        params.set("kategorie", next);
      }
      const query = params.toString();
      router.replace(query ? `/?${query}` : "/", { scroll: false });
    },
    [router, searchParams],
  );

  return (
    <div
      className={`min-h-[calc(100vh-3.5rem)] transition-[background] duration-500 ease-out ${theme.shellClass}`}
    >
      <div className="px-4 py-8 sm:px-6">
        <section
          className={`rounded-2xl border p-6 shadow-sm transition-[background,border-color] duration-500 sm:p-8 ${theme.heroClass} ${theme.heroBorderClass}`}
        >
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            {theme.label}
          </p>
          <h1
            className={`mt-1 text-2xl font-semibold sm:text-3xl ${theme.accentClass}`}
          >
            {theme.headline}
          </h1>
          <p className="mt-3 max-w-xl text-gray-600">{theme.subline}</p>

          {user ? (
            <p className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/inzerat/novy"
                {...gtmCtaProps(GTM_CTA.HOME_CREATE_LISTING)}
                className={`inline-flex rounded-xl px-5 py-2.5 text-sm font-medium transition ${theme.ctaClass}`}
              >
                Založit inzerát
              </Link>
              <span className="text-sm text-gray-600">
                Přihlášen jako{" "}
                <span className="font-medium text-gray-900">
                  {user.displayName}
                </span>
              </span>
            </p>
          ) : (
            <p className="mt-6 text-sm text-gray-600">
              Pro vytváření inzerátů se{" "}
              <Link
                href="/login"
                {...gtmCtaProps(GTM_CTA.HOME_SIGN_IN_LINK)}
                className="font-medium text-gray-900 underline-offset-2 hover:underline"
              >
                přihlaste se přes Google
              </Link>
              .
            </p>
          )}
        </section>

        <nav
          aria-label="Kategorie inzerátů"
          className="mt-6 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {HOME_CATEGORY_ORDER.map((id) => {
            const item = HOME_THEMES[id];
            const isActive = category === id;
            return (
              <button
                key={id}
                type="button"
                {...gtmCtaProps(GTM_CTA.HOME_CATEGORY_TAB, { category: id })}
                onClick={() => setCategory(id)}
                aria-current={isActive ? "page" : undefined}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition duration-300 ${
                  isActive ? item.tabActiveClass : item.tabInactiveClass
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <HomeListings
          category={category}
          theme={theme}
          searchQuery={searchQuery}
          initialListings={initialListings}
          initialListingsCategory={initialListingsCategory}
        />
      </div>
    </div>
  );
}
