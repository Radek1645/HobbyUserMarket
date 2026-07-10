"use client";

import { useCurrentUser } from "@/components/auth/UserContext";
import { HomeListings } from "@/components/home/HomeListings";
import { GTM_CTA, gtmCtaProps } from "@/config/gtm-ids";
import {
  CATEGORIES_CONFIG,
  HOME_THEMES,
  parseHomeBrowseCategory,
  type HomeBrowseCategory,
} from "@/config/home-themes";
import {
  homeCategoryTabActiveClass,
  homeCategoryTabInactiveClass,
  iconSmClass,
} from "@/config/ui-primitives";
import { normalizeSearchQuery } from "@/lib/posts/search-query";
import type { PublicListingPreview } from "@/types/post";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

function HeroHeadline({
  headline,
  highlightAi = false,
}: {
  headline: string;
  highlightAi?: boolean;
}) {
  const baseClass = "mt-1 text-2xl font-semibold text-zinc-900 sm:text-3xl";

  if (!highlightAi) {
    return <h1 className={baseClass}>{headline}</h1>;
  }

  const aiMatch = headline.match(/^(.*\s)(AI)$/);
  if (!aiMatch) {
    return <h1 className={baseClass}>{headline}</h1>;
  }

  return (
    <h1 className={baseClass}>
      {aiMatch[1]}
      <span className="text-emerald-600 [text-shadow:0_0_18px_rgba(16,185,129,0.55),0_0_36px_rgba(16,185,129,0.25)]">
        {aiMatch[2]}
      </span>
    </h1>
  );
}

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
    <div className="min-h-[calc(100vh-3.5rem)] bg-zinc-50">
      <div className="px-4 py-8 sm:px-6">
        <section className="relative overflow-hidden rounded-2xl border border-orange-200/60 bg-gradient-to-r from-orange-200 via-amber-50 to-emerald-200 shadow-sm">
          <div className="p-6 sm:p-8">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-600">
              {theme.label}
            </p>
            <HeroHeadline
              headline={theme.headline}
              highlightAi={category === "all"}
            />
            <p className="mt-3 max-w-xl text-gray-700">{theme.subline}</p>

            {!user ? (
              <div className="mt-3 w-fit max-w-md">
                <div
                  className="border-t border-gray-300/70"
                  aria-hidden="true"
                />
                <p className="pt-2 text-xs text-gray-600">
                  Bez registrace – přihlášení přes Google jedním kliknutím.
                </p>
              </div>
            ) : null}

            <nav
              aria-label="Kategorie inzerátů"
              className="mt-6 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {CATEGORIES_CONFIG.map(({ id, label, icon: Icon }) => {
                const isActive = category === id;
                return (
                  <button
                    key={id}
                    type="button"
                    {...gtmCtaProps(GTM_CTA.HOME_CATEGORY_TAB, {
                      category: id,
                    })}
                    onClick={() => setCategory(id)}
                    aria-current={isActive ? "page" : undefined}
                    className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${
                      isActive
                        ? homeCategoryTabActiveClass
                        : homeCategoryTabInactiveClass
                    }`}
                  >
                    <Icon className={iconSmClass} aria-hidden="true" />
                    {label}
                  </button>
                );
              })}
            </nav>
          </div>
        </section>

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
