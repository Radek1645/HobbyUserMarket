"use client";

import { useCurrentUser } from "@/components/auth/UserContext";
import { HomeListings } from "@/components/home/HomeListings";
import { HomeSeoBlurb } from "@/components/home/HomeSeoBlurb";
import { CREATE_LISTING_GUIDE_PATH } from "@/config/create-listing-guide";
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
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

const aiHighlightClass =
  "font-[850] text-[1.1em] tracking-[0.5px] text-[#00875a]";

const guideLinkClass =
  "font-medium text-zinc-900 underline decoration-emerald-600/50 underline-offset-2 transition hover:decoration-emerald-700";

function HeroHeadline({ headline }: { headline: string }) {
  return (
    <h1 className="text-2xl font-semibold text-zinc-900 sm:text-3xl">
      {headline}
    </h1>
  );
}

function HeroSubline({
  subline,
  highlightAi = false,
}: {
  subline: string;
  highlightAi?: boolean;
}) {
  const baseClass = "mt-3 max-w-xl text-gray-700";

  if (!highlightAi) {
    return <p className={baseClass}>{subline}</p>;
  }

  const detailMatch = subline.match(/^(AI)( se )(doptá na detaily)(.*)$/);
  if (detailMatch) {
    return (
      <p className={baseClass}>
        <span className={aiHighlightClass}>{detailMatch[1]}</span>
        {detailMatch[2]}
        <Link
          href={CREATE_LISTING_GUIDE_PATH}
          className={guideLinkClass}
          {...gtmCtaProps(GTM_CTA.HOME_CREATE_LISTING_GUIDE)}
        >
          {detailMatch[3]}
        </Link>
        {detailMatch[4]}
      </p>
    );
  }

  const aiMatch = subline.match(/^(AI)(\s.*)$/);
  if (!aiMatch) {
    return <p className={baseClass}>{subline}</p>;
  }

  return (
    <p className={baseClass}>
      <span className={aiHighlightClass}>AI</span>
      {aiMatch[2]}
    </p>
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
            <HeroHeadline headline={theme.headline} />
            <HeroSubline
              subline={theme.subline}
              highlightAi={category === "all"}
            />

            {!user ? (
              <div className="mt-3 max-w-xl">
                <div
                  className="border-t border-gray-300/70"
                  aria-hidden="true"
                />
                <p className="pt-2 text-xs text-gray-600">
                  Žádné zdlouhavé registrace. Přihlaste se na jeden klik přes
                  Google nebo klasicky e-mailem.
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

        <HomeSeoBlurb />
      </div>
    </div>
  );
}
