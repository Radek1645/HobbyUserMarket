"use client";

import { ListingCard } from "@/components/listing/ListingCard";
import { LocationInput } from "@/components/listing/LocationInput";
import { HOME_LISTINGS_LIMIT, SEARCH_RADIUS_KM } from "@/config/app";
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
import { useCallback, useEffect, useState } from "react";

type FetchMode = "nearby" | "recent";

type HomeListingsProps = {
  category: HomeBrowseCategory;
  theme: HomeTheme;
};

export function HomeListings({ category, theme }: HomeListingsProps) {
  const [location, setLocation] = useState<VisitorLocation | null>(null);
  const [searchByLocation, setSearchByLocation] = useState(true);
  const [locationReady, setLocationReady] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [listings, setListings] = useState<PublicListingPreview[]>([]);
  const [fetchMode, setFetchMode] = useState<FetchMode>("recent");
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
            p_radius_km: SEARCH_RADIUS_KM,
            p_limit: HOME_LISTINGS_LIMIT,
            p_category_type: rpcCategory,
          });

          if (rpcError) throw rpcError;

          setListings((data ?? []) as PublicListingPreview[]);
          setFetchMode("nearby");
        } else {
          const { data, error: rpcError } = await supabase.rpc("get_recent_posts", {
            p_limit: HOME_LISTINGS_LIMIT,
            p_category_type: rpcCategory,
          });

          if (rpcError) throw rpcError;

          setListings((data ?? []) as PublicListingPreview[]);
          setFetchMode("recent");
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
    setSearchByLocation(loadSearchByLocation());

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
    if (!locationReady) return;
    const effectiveLocation = searchByLocation ? location : null;
    void fetchListings(effectiveLocation, category);
  }, [category, fetchListings, location, locationReady, searchByLocation]);

  function toggleSearchByLocation(enabled: boolean) {
    setSearchByLocation(enabled);
    saveSearchByLocation(enabled);
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
    toggleSearchByLocation(true);
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

  const inputClass =
    "mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-200";
  const labelClass = "block text-sm font-medium text-gray-700";

  const locationFilterActive = Boolean(searchByLocation && location);

  const sectionTitle =
    locationFilterActive && location
      ? `${theme.label} v okolí ${formatPublicAreaLocation(location.locationText)}`
      : `${theme.label} — nejnovější`;

  return (
    <section className="mt-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className={`text-lg font-semibold ${theme.accentClass}`}>
            {sectionTitle}
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">
            {locationFilterActive
              ? `Do ${SEARCH_RADIUS_KM} km od tebe`
              : location
                ? "Bez filtru vzdálenosti — nejnovější inzeráty"
                : "Vyber polohu pro inzeráty ve svém okolí"}
          </p>
        </div>

        {location ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={searchByLocation}
                onChange={(event) => toggleSearchByLocation(event.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-400"
              />
              Hledat podle polohy
            </label>
            <button
              type="button"
              {...gtmCtaProps(GTM_CTA.HOME_CHANGE_LOCATION)}
              onClick={handleChangeLocation}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 underline-offset-2 hover:underline"
            >
              <MapPin className="h-4 w-4" />
              Změnit polohu
            </button>
          </div>
        ) : null}
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

      {locationReady && !loading && listings.length === 0 && !error ? (
        <p className="mt-8 rounded-2xl border border-dashed border-gray-200/80 bg-white/70 px-4 py-10 text-center text-sm text-gray-500 backdrop-blur-sm">
          {fetchMode === "nearby"
            ? `V okruhu ${SEARCH_RADIUS_KM} km v kategorii „${theme.label}“ zatím nic není. Zkus vypnout „Hledat podle polohy“.`
            : `V kategorii „${theme.label}“ zatím nic není.`}
        </p>
      ) : null}

      {locationReady && !loading && listings.length > 0 ? (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <li key={listing.id}>
              <ListingCard listing={listing} />
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
