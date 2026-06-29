"use client";

import { getCategoryConfig } from "@/config/categories";
import { GTM_CTA, gtmCtaProps } from "@/config/gtm-ids";
import type { HomeBrowseCategory, HomeTheme } from "@/config/home-themes";
import type { PublicListingPreview } from "@/types/post";
import { SlidersHorizontal, X } from "lucide-react";
import { useEffect, useId, useRef } from "react";

export type ListingSortMode = "default" | "newest" | "nearest";

export type HomeListingFilterState = {
  subcategorySlug: string | null;
  sort: ListingSortMode;
  searchByLocation: boolean;
};

type HomeListingFilterProps = {
  category: HomeBrowseCategory;
  theme: HomeTheme;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filter: HomeListingFilterState;
  onFilterChange: (next: HomeListingFilterState) => void;
  hasLocation: boolean;
};

const SORT_OPTIONS: { value: ListingSortMode; label: string }[] = [
  { value: "default", label: "Doporučené" },
  { value: "newest", label: "Nejnovější" },
  { value: "nearest", label: "Nejbližší" },
];

export function countActiveFilters(
  filter: HomeListingFilterState,
  category: HomeBrowseCategory,
): number {
  let count = 0;
  if (category !== "all" && filter.subcategorySlug) count += 1;
  if (filter.sort !== "default") count += 1;
  if (!filter.searchByLocation) count += 1;
  return count;
}

export function applyListingFilters(
  listings: PublicListingPreview[],
  filter: HomeListingFilterState,
  category: HomeBrowseCategory,
): PublicListingPreview[] {
  let result = [...listings];

  if (category !== "all" && filter.subcategorySlug) {
    result = result.filter(
      (item) => item.subcategory_slug === filter.subcategorySlug,
    );
  }

  if (filter.sort === "newest") {
    result.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  } else if (filter.sort === "nearest") {
    result.sort((a, b) => {
      const da = a.distance_km ?? Number.POSITIVE_INFINITY;
      const db = b.distance_km ?? Number.POSITIVE_INFINITY;
      return da - db;
    });
  }

  return result;
}

export function HomeListingFilter({
  category,
  theme,
  open,
  onOpenChange,
  filter,
  onFilterChange,
  hasLocation,
}: HomeListingFilterProps) {
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  const subcategories =
    category === "all" ? [] : getCategoryConfig(category).subcategories;

  const activeCount = countActiveFilters(filter, category);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        onOpenChange(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onOpenChange(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onOpenChange]);

  function patch(partial: Partial<HomeListingFilterState>) {
    onFilterChange({ ...filter, ...partial });
  }

  function resetFilters() {
    onFilterChange({
      subcategorySlug: null,
      sort: "default",
      searchByLocation: true,
    });
  }

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        {...gtmCtaProps(GTM_CTA.HOME_OPEN_FILTER, { category })}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => onOpenChange(!open)}
        className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition ${
          open || activeCount > 0
            ? theme.tabActiveClass
            : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
        }`}
      >
        <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
        Filtr
        {activeCount > 0 ? (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white/25 px-1.5 text-xs font-semibold">
            {activeCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          id={panelId}
          className="absolute top-full right-0 z-30 mt-2 w-[min(100vw-2rem,20rem)] rounded-2xl border border-gray-200 bg-white p-4 shadow-xl shadow-gray-900/10"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-gray-900">Filtr výpisu</p>
            <button
              type="button"
              aria-label="Zavřít filtr"
              onClick={() => onOpenChange(false)}
              className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 space-y-4">
            <fieldset>
              <legend className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Řazení
              </legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {SORT_OPTIONS.map((option) => {
                  const disabled =
                    option.value === "nearest" && !hasLocation;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      disabled={disabled}
                      {...gtmCtaProps(GTM_CTA.HOME_FILTER_SORT, {
                        category,
                        sort: option.value,
                      })}
                      onClick={() => patch({ sort: option.value })}
                      className={`rounded-full border px-3 py-1.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${
                        filter.sort === option.value
                          ? theme.tabActiveClass
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {category !== "all" ? (
              <fieldset>
                <legend className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Podkategorie
                </legend>
                <div className="mt-2 max-h-44 space-y-1 overflow-y-auto">
                  <button
                    type="button"
                    {...gtmCtaProps(GTM_CTA.HOME_FILTER_SUBCATEGORY, {
                      category,
                      subcategory: "all",
                    })}
                    onClick={() => patch({ subcategorySlug: null })}
                    className={`flex w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                      filter.subcategorySlug === null
                        ? "bg-gray-100 font-medium text-gray-900"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Vše v {getCategoryConfig(category).label.toLowerCase()}
                  </button>
                  {subcategories.map((sub) => (
                    <button
                      key={sub.slug}
                      type="button"
                      {...gtmCtaProps(GTM_CTA.HOME_FILTER_SUBCATEGORY, {
                        category,
                        subcategory: sub.slug,
                      })}
                      onClick={() => patch({ subcategorySlug: sub.slug })}
                      className={`flex w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                        filter.subcategorySlug === sub.slug
                          ? "bg-gray-100 font-medium text-gray-900"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              </fieldset>
            ) : (
              <p className="text-sm text-gray-500">
                Podkategorie filtruj po výběru hlavní kategorie (Zboží,
                Služby…).
              </p>
            )}

            <fieldset>
              <legend className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Poloha
              </legend>
              <label className="mt-2 flex cursor-pointer items-center gap-2 rounded-xl px-1 py-1 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={filter.searchByLocation}
                  disabled={!hasLocation}
                  onChange={(event) =>
                    patch({ searchByLocation: event.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-400 disabled:opacity-50"
                />
                Hledat podle polohy
              </label>
              {!hasLocation ? (
                <p className="mt-1 px-1 text-xs text-gray-500">
                  Nejdřív nastav polohu výpisem v okolí.
                </p>
              ) : null}
            </fieldset>
          </div>

          {activeCount > 0 ? (
            <button
              type="button"
              onClick={resetFilters}
              className="mt-4 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Obnovit filtr
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
