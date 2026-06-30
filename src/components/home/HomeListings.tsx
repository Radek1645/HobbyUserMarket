"use client";

import {
  applyListingFilters,
  HomeListingFilter,
  type HomeListingFilterState,
} from "@/components/home/HomeListingFilter";
import { ListingCard } from "@/components/listing/ListingCard";
import { LocationInput } from "@/components/listing/LocationInput";
import {
  HOME_LISTINGS_FETCH_LIMIT,
  HOME_LISTINGS_LIMIT,
  HOME_LISTINGS_MIN_REQUIRED,
  SEARCH_RADIUS_KM,
  SEARCH_RADIUS_STEPS_KM,
} from "@/config/app";
import { getSubcategoryLabel } from "@/config/categories";
import { GTM_CTA, gtmCtaProps } from "@/config/gtm-ids";
import type { HomeBrowseCategory, HomeTheme } from "@/config/home-themes";
import {
  formatPublicAreaLocation,
  reverseGeocodeLocation,
} from "@/lib/mapy/client";
import {
  clearVisitorLocation,
  loadSearchByLocation,
  loadVisitorLocation,
  saveSearchByLocation,
  saveVisitorLocation,
  type VisitorLocation,
} from "@/lib/posts/visitor-location";
import { createClient } from "@/lib/supabase/client";
import type { PublicListingPreview } from "@/types/post";
import { Loader2, MapPin } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type FetchMode = "nearby" | "recent";

const DEFAULT_FILTER: HomeListingFilterState = {
  subcategorySlug: null,
  sort: "default",
  searchByLocation: true,
};

type HomeListingsProps = {
  category: HomeBrowseCategory;
  theme: HomeTheme;
};

export function HomeListings({ category, theme }: HomeListingsProps) {
  const [location, setLocation] = useState<VisitorLocation | null>(null);
  const [filter, setFilter] = useState<HomeListingFilterState>(DEFAULT_FILTER);
  const [filterOpen, setFilterOpen] = useState(false);
  const [locationReady, setLocationReady] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [listings, setListings] = useState<PublicListingPreview[]>([]);
  const [fetchMode, setFetchMode] = useState<FetchMode>("recent");
  const [effectiveRadiusKm, setEffectiveRadiusKm] = useState<number | null>(null);
  const [nationwideFallback, setNationwideFallback] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [pickerValue, setPickerValue] = useState({
    locationText: "",
    latitude: null as number | null,
    longitude: null as number | null,
  });

  const fetchListings = useCallback(
    async (loc: VisitorLocation | null, cat: HomeBrowseCategory) => {
      setLoading(true);
      setError(null);

      const supabase = createClient();
      const rpcCategory = cat === "all" ? null : cat;

      try {
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
        setError("Inzeráty se nepodařilo načíst. Zkus obnovit stránku.");
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
      searchByLocation: loadSearchByLocation(),
    }));

    const saved = loadVisitorLocation();
    if (saved) {
      setLocation(saved);
      setLocationReady(true);
      return;
    }

    if (!navigator.geolocation) {
      setLocationReady(true);
      setShowPicker(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const selection = await reverseGeocodeLocation(
            position.coords.latitude,
            position.coords.longitude,
            undefined,
            { approximate: true },
          );
          const loc: VisitorLocation = {
            locationText: selection.locationText,
            latitude: selection.latitude,
            longitude: selection.longitude,
          };
          saveVisitorLocation(loc);
          setLocation(loc);
        } catch {
          const loc: VisitorLocation = {
            locationText: "Moje poloha",
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          saveVisitorLocation(loc);
          setLocation(loc);
        } finally {
          setLocationReady(true);
        }
      },
      () => {
        setLocationReady(true);
        setShowPicker(true);
      },
      { enableHighAccuracy: false, timeout: 12_000, maximumAge: 300_000 },
    );
  }, []);

  useEffect(() => {
    setFilter((current) => ({
      ...current,
      subcategorySlug: null,
    }));
    setFilterOpen(false);
  }, [category]);

  useEffect(() => {
    if (!locationReady) return;
    const effectiveLocation = filter.searchByLocation ? location : null;
    void fetchListings(effectiveLocation, category);
  }, [
    category,
    fetchListings,
    filter.searchByLocation,
    location,
    locationReady,
  ]);

  function handleFilterChange(next: HomeListingFilterState) {
    setFilter(next);
    saveSearchByLocation(next.searchByLocation);
  }

  function applyPickerLocation() {
    if (
      pickerValue.latitude == null ||
      pickerValue.longitude == null ||
      !pickerValue.locationText.trim()
    ) {
      setError("Vyber obec z našeptávače nebo použij GPS.");
      return;
    }

    const loc: VisitorLocation = {
      locationText: formatPublicAreaLocation(pickerValue.locationText),
      latitude: pickerValue.latitude,
      longitude: pickerValue.longitude,
    };

    saveVisitorLocation(loc);
    setLocation(loc);
    handleFilterChange({ ...filter, searchByLocation: true });
    setShowPicker(false);
    setError(null);
    void fetchListings(loc, category);
  }

  function handleChangeLocation() {
    clearVisitorLocation();
    setLocation(null);
    setShowPicker(true);
    setPickerValue({
      locationText: "",
      latitude: null,
      longitude: null,
    });
  }

  const filteredListings = useMemo(() => {
    const filtered = applyListingFilters(listings, filter, category);
    return filtered.slice(0, HOME_LISTINGS_LIMIT);
  }, [category, filter, listings]);

  const inputClass =
    "mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-200";
  const labelClass = "block text-sm font-medium text-gray-700";

  const locationFilterActive = Boolean(filter.searchByLocation && location);

  const sectionTitle =
    locationFilterActive && location && fetchMode === "nearby"
      ? `${theme.label} v okolí ${formatPublicAreaLocation(location.locationText)}`
      : `${theme.label} — nejnovější`;

  const listingsSubtitle = (() => {
    if (locationFilterActive && fetchMode === "nearby" && effectiveRadiusKm != null) {
      if (effectiveRadiusKm > SEARCH_RADIUS_KM) {
        return `V bezprostředním okolí málo inzerátů — zobrazujeme do ${effectiveRadiusKm} km od tebe`;
      }
      return `Do ${effectiveRadiusKm} km od tebe`;
    }
    if (locationFilterActive && nationwideFallback) {
      return "Ve tvém okolí zatím nic není — nejnovější inzeráty z celé republiky";
    }
    if (location && !filter.searchByLocation) {
      return "Bez filtru vzdálenosti — nejnovější inzeráty";
    }
    if (!location) {
      return "Vyber polohu pro inzeráty ve svém okolí";
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

        <div className="flex shrink-0 items-center gap-2">
          {location ? (
            <button
              type="button"
              {...gtmCtaProps(GTM_CTA.HOME_CHANGE_LOCATION)}
              onClick={handleChangeLocation}
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
            >
              <MapPin className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Změnit polohu</span>
              <span className="sm:hidden">Poloha</span>
            </button>
          ) : null}

          <HomeListingFilter
            category={category}
            theme={theme}
            open={filterOpen}
            onOpenChange={setFilterOpen}
            filter={filter}
            onFilterChange={handleFilterChange}
            hasLocation={Boolean(location)}
          />
        </div>
      </div>

      {showPicker && !location ? (
        <div
          className={`mt-4 rounded-2xl border p-4 sm:p-5 ${theme.heroClass} ${theme.heroBorderClass}`}
        >
          <p className="text-sm text-gray-600">
            Pro inzeráty v okolí vyber obec nebo povol polohu v prohlížeči.
          </p>
          <div className="mt-3">
            <LocationInput
              value={pickerValue}
              onChange={setPickerValue}
              inputClass={inputClass}
              labelClass={labelClass}
            />
          </div>
          <button
            type="button"
            {...gtmCtaProps(GTM_CTA.HOME_APPLY_LOCATION)}
            onClick={applyPickerLocation}
            className={`mt-4 rounded-xl px-4 py-2.5 text-sm font-medium transition ${theme.ctaClass}`}
          >
            Zobrazit inzeráty v okolí
          </button>
        </div>
      ) : null}

      {!locationReady || loading ? (
        <div className="mt-8 flex items-center justify-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Načítám inzeráty…
        </div>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {error}
        </p>
      ) : null}

      {locationReady && !loading && filteredListings.length === 0 && !error ? (
        <p className="mt-8 rounded-2xl border border-dashed border-gray-200/80 bg-white/70 px-4 py-10 text-center text-sm text-gray-500 backdrop-blur-sm">
          {listings.length > 0 && filter.subcategorySlug
            ? `V podkategorii „${subcategoryLabel}“ zatím nic není. Zkus jiný filtr.`
            : fetchMode === "nearby"
              ? `V okolí do ${effectiveRadiusKm ?? SEARCH_RADIUS_KM} km v kategorii „${theme.label}“ zatím nic není. Zkus vypnout „Hledat podle polohy“ ve filtru.`
              : nationwideFallback
                ? `V okolí zatím nic není a v kategorii „${theme.label}“ není ani celostátní inzerce.`
                : `V kategorii „${theme.label}“ zatím nic není.`}
        </p>
      ) : null}

      {locationReady && !loading && filteredListings.length > 0 ? (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {filteredListings.map((listing) => (
            <li key={listing.id}>
              <ListingCard listing={listing} imageFirst />
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
