"use client";

import {
  applyListingFilters,
  HomeListingFilter,
  type HomeListingFilterState,
} from "@/components/home/HomeListingFilter";
import { ListingCard } from "@/components/listing/ListingCard";
import { useVisitorLocationContext } from "@/components/location/VisitorLocationProvider";
import {
  HOME_LISTINGS_FETCH_LIMIT,
  HOME_LISTINGS_LIMIT,
  HOME_LISTINGS_MIN_REQUIRED,
  SEARCH_RADIUS_KM,
  SEARCH_RADIUS_STEPS_KM,
} from "@/config/app";
import { getSubcategoryLabel } from "@/config/categories";
import type { HomeBrowseCategory, HomeTheme } from "@/config/home-themes";
import { formatPublicAreaLocation } from "@/lib/mapy/client";
import { isSearchQueryValid } from "@/lib/posts/search-query";
import type { VisitorLocation } from "@/lib/posts/visitor-location";
import { createClient } from "@/lib/supabase/client";
import type { PublicListingPreview } from "@/types/post";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type FetchMode = "nearby" | "recent" | "search";

const DEFAULT_FILTER: HomeListingFilterState = {
  subcategorySlug: null,
  sort: "default",
};

type HomeListingsProps = {
  category: HomeBrowseCategory;
  theme: HomeTheme;
  searchQuery?: string;
  initialListings?: PublicListingPreview[] | null;
  initialListingsCategory?: HomeBrowseCategory | null;
};

export function HomeListings({
  category,
  theme,
  searchQuery = "",
  initialListings = null,
  initialListingsCategory = null,
}: HomeListingsProps) {
  const hasInitialForCategory =
    initialListings != null &&
    initialListingsCategory != null &&
    initialListingsCategory === category &&
    !searchQuery;

  const { location, locationEnabled, ready: locationReady } = useVisitorLocationContext();
  const activeLocation = locationEnabled ? location : null;
  const [filter, setFilter] = useState<HomeListingFilterState>(DEFAULT_FILTER);
  const [filterOpen, setFilterOpen] = useState(false);
  const [listings, setListings] = useState<PublicListingPreview[]>(
    () => (hasInitialForCategory ? initialListings : []),
  );
  const [fetchMode, setFetchMode] = useState<FetchMode>("recent");
  const [effectiveRadiusKm, setEffectiveRadiusKm] = useState<number | null>(null);
  const [nationwideFallback, setNationwideFallback] = useState(false);
  const [loading, setLoading] = useState(() => !hasInitialForCategory);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(HOME_LISTINGS_LIMIT);

  const fetchListings = useCallback(
    async (
      loc: VisitorLocation | null,
      cat: HomeBrowseCategory,
      query: string,
      options?: { silent?: boolean },
    ) => {
      if (!options?.silent) {
        setLoading(true);
      }
      setError(null);

      const supabase = createClient();
      const rpcCategory = cat === "all" ? null : cat;

      try {
        if (query && isSearchQueryValid(query)) {
          const searchParams: {
            p_query: string;
            p_category_type: string | null;
            p_limit: number;
            p_latitude?: number;
            p_longitude?: number;
          } = {
            p_query: query,
            p_category_type: rpcCategory,
            p_limit: HOME_LISTINGS_FETCH_LIMIT,
          };

          if (loc) {
            searchParams.p_latitude = loc.latitude;
            searchParams.p_longitude = loc.longitude;
          }

          const { data, error: rpcError } = await supabase.rpc(
            "search_posts",
            searchParams,
          );

          if (rpcError) throw rpcError;

          setListings((data ?? []) as PublicListingPreview[]);
          setFetchMode("search");
          setEffectiveRadiusKm(null);
          setNationwideFallback(false);
          return;
        }

        if (loc) {
          const { data, error: rpcError } = await supabase.rpc("get_nearby_posts", {
            p_latitude: loc.latitude,
            p_longitude: loc.longitude,
            p_radius_steps_km: [...SEARCH_RADIUS_STEPS_KM],
            p_min_required: HOME_LISTINGS_MIN_REQUIRED,
            p_limit: HOME_LISTINGS_FETCH_LIMIT,
            p_category_type: rpcCategory,
          });

          if (rpcError) throw rpcError;

          const nearby = (data ?? []) as PublicListingPreview[];

          if (nearby.length < HOME_LISTINGS_MIN_REQUIRED) {
            const { data: recentData, error: recentError } = await supabase.rpc(
              "get_recent_posts",
              {
                p_limit: HOME_LISTINGS_FETCH_LIMIT,
                p_category_type: rpcCategory,
              },
            );

            if (recentError) throw recentError;

            setListings((recentData ?? []) as PublicListingPreview[]);
            setFetchMode("recent");
            setEffectiveRadiusKm(null);
            setNationwideFallback(true);
          } else {
            setListings(nearby);
            setFetchMode("nearby");
            setEffectiveRadiusKm(nearby[0]?.effective_radius_km ?? SEARCH_RADIUS_KM);
            setNationwideFallback(false);
          }
        } else {
          const { data, error: rpcError } = await supabase.rpc("get_recent_posts", {
            p_limit: HOME_LISTINGS_FETCH_LIMIT,
            p_category_type: rpcCategory,
          });

          if (rpcError) throw rpcError;

          setListings((data ?? []) as PublicListingPreview[]);
          setFetchMode("recent");
          setEffectiveRadiusKm(null);
          setNationwideFallback(false);
        }
      } catch (e) {
        console.error("home listings:", e);
        setError("Inzeráty se nepodařilo načíst. Zkuste obnovit stránku.");
        setListings([]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    setFilter((current) => ({
      ...current,
      subcategorySlug: null,
    }));
    setFilterOpen(false);
  }, [category]);

  useEffect(() => {
    if (searchQuery && !isSearchQueryValid(searchQuery)) {
      setLoading(false);
      setListings([]);
      setError(null);
      setFetchMode("search");
      return;
    }

    if (searchQuery && isSearchQueryValid(searchQuery)) {
      void fetchListings(activeLocation, category, searchQuery);
      return;
    }

    if (!locationReady) {
      if (hasInitialForCategory) {
        setListings(initialListings);
        setFetchMode("recent");
        setEffectiveRadiusKm(null);
        setNationwideFallback(false);
        setLoading(false);
        setError(null);
      }
      return;
    }

    if (!activeLocation && hasInitialForCategory) {
      setListings(initialListings);
      setFetchMode("recent");
      setEffectiveRadiusKm(null);
      setNationwideFallback(false);
      setLoading(false);
      setError(null);
      return;
    }

    void fetchListings(activeLocation, category, "", { silent: hasInitialForCategory });
  }, [
    activeLocation,
    category,
    fetchListings,
    hasInitialForCategory,
    initialListings,
    locationReady,
    searchQuery,
  ]);

  const filteredListings = useMemo(
    () => applyListingFilters(listings, filter, category),
    [category, filter, listings],
  );

  useEffect(() => {
    setVisibleCount(HOME_LISTINGS_LIMIT);
  }, [category, filter, searchQuery]);

  const visibleListings = useMemo(
    () => filteredListings.slice(0, visibleCount),
    [filteredListings, visibleCount],
  );
  const hasMoreListings = filteredListings.length > visibleCount;

  const searchActive = searchQuery.length > 0;
  const searchValid = isSearchQueryValid(searchQuery);

  const sectionTitle = searchActive
    ? searchValid
      ? `Výsledky pro „${searchQuery}"`
      : "Vyhledávání"
    : activeLocation && fetchMode === "nearby"
      ? `${theme.label} v okolí ${formatPublicAreaLocation(activeLocation.locationText)}`
      : `${theme.label} — nejnovější`;

  const listingsSubtitle = (() => {
    if (searchActive) {
      if (!searchValid) {
        return "Zadejte alespoň 3 znaky pro fulltextové hledání";
      }
      if (activeLocation) {
        return "Seřazeno podle relevance, vzdálenost doplňuje řazení";
      }
      return "Seřazeno podle relevance";
    }
    if (activeLocation && fetchMode === "nearby" && effectiveRadiusKm != null) {
      if (effectiveRadiusKm > SEARCH_RADIUS_KM) {
        return `V bezprostředním okolí je málo inzerátů — zobrazujeme do ${effectiveRadiusKm} km od vaší polohy`;
      }
      return `Do ${effectiveRadiusKm} km od vaší polohy`;
    }
    if (activeLocation && nationwideFallback) {
      return "Ve vašem okolí zatím nic není. Zobrazujeme nejnovější inzeráty z celé republiky.";
    }
    if (!activeLocation) {
      return locationEnabled
        ? "Pro inzeráty z okolí zvolte obec v horní liště"
        : "Zobrazujeme nejnovější inzeráty bez filtrování podle polohy";
    }
    return "Nejnovější inzeráty";
  })();

  const subcategoryLabel =
    category !== "all" && filter.subcategorySlug
      ? getSubcategoryLabel(category, filter.subcategorySlug).label
      : null;

  return (
    <section className="mt-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className={`text-lg font-semibold ${theme.accentClass}`}>
            {sectionTitle}
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">
            {listingsSubtitle}
            {subcategoryLabel ? ` · ${subcategoryLabel}` : ""}
          </p>
        </div>

        <HomeListingFilter
          category={category}
          theme={theme}
          open={filterOpen}
          onOpenChange={setFilterOpen}
          filter={filter}
          onFilterChange={setFilter}
          hasLocation={Boolean(activeLocation)}
        />
      </div>

      {loading && !hasInitialForCategory ? (
        <div className="mt-8 flex items-center justify-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Načítám inzeráty…
        </div>
      ) : null}

      {searchActive && !searchValid ? (
        <p
          role="status"
          className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-950"
        >
          Pro hledání zadejte alespoň 3 znaky — teď ukazujeme výpis podle
          kategorie a filtrů.
        </p>
      ) : null}

      {(searchActive || locationReady || hasInitialForCategory) &&
      visibleListings.length > 0 ? (
        <>
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            {visibleListings.map((listing, index) => (
              <li key={listing.id}>
                <ListingCard listing={listing} imageFirst priority={index < 3} />
              </li>
            ))}
          </ul>
          {hasMoreListings ? (
            <div className="mt-4 flex flex-col items-center gap-2">
              <p className="text-xs text-gray-500">
                Zobrazeno {visibleListings.length} z {filteredListings.length}
              </p>
              <button
                type="button"
                onClick={() =>
                  setVisibleCount((count) =>
                    Math.min(
                      count + HOME_LISTINGS_LIMIT,
                      filteredListings.length,
                    ),
                  )
                }
                className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 transition hover:bg-gray-50"
              >
                Zobrazit další
              </button>
            </div>
          ) : null}
        </>
      ) : null}

      {loading && hasInitialForCategory && activeLocation ? (
        <p className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Aktualizuji podle polohy…
        </p>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {error}
        </p>
      ) : null}

      {(searchActive || locationReady || hasInitialForCategory) &&
      !loading &&
      visibleListings.length === 0 &&
      !error ? (
        <p className="mt-8 rounded-2xl border border-dashed border-gray-200/80 bg-white/70 px-4 py-10 text-center text-sm text-gray-500 backdrop-blur-sm">
          {searchActive && searchValid
            ? `Pro „${searchQuery}" jsme nic nenašli. Zkuste jiné slovo nebo kategorii.`
            : listings.length > 0 && filter.subcategorySlug
            ? `V podkategorii „${subcategoryLabel}“ zatím nic není. Zkuste jiný filtr.`
            : fetchMode === "nearby"
              ? `V okolí do ${effectiveRadiusKm ?? SEARCH_RADIUS_KM} km v kategorii „${theme.label}“ zatím nic není. Zkuste jinou kategorii nebo polohu.`
              : nationwideFallback
                ? `V okolí zatím nic není a v kategorii „${theme.label}“ není ani celostátní inzerce.`
                : `V kategorii „${theme.label}“ zatím nic není.`}
        </p>
      ) : null}
    </section>
  );
}
