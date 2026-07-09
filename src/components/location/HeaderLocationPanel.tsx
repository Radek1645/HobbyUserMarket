"use client";

import { useVisitorLocationContext } from "@/components/location/VisitorLocationProvider";
import { GTM_CTA, gtmCtaProps } from "@/config/gtm-ids";
import { formatHeaderAreaLocation, formatPublicAreaLocation } from "@/lib/mapy/client";
import { ChevronDown, Loader2, MapPin, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";

const LocationInput = dynamic(
  () =>
    import("@/components/listing/LocationInput").then((mod) => ({
      default: mod.LocationInput,
    })),
  {
    loading: () => (
      <div className="h-10 animate-pulse rounded-lg bg-gray-100" aria-hidden="true" />
    ),
    ssr: false,
  },
);

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm text-gray-900 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-200";

export function HeaderLocationPanel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    location,
    locationEnabled,
    panelOpen,
    editingLocation,
    togglePanel,
    closePanel,
    pickerValue,
    setPickerValue,
    panelError,
    gpsLoading,
    applyPickerLocation,
    applyGpsLocation,
    beginChangeLocation,
    optOutLocation,
  } = useVisitorLocationContext();

  const hasActiveLocation = Boolean(location && locationEnabled);

  const locationFullLabel = hasActiveLocation
    ? formatPublicAreaLocation(location!.locationText)
    : null;

  const locationLabel = hasActiveLocation
    ? formatHeaderAreaLocation(location!.locationText)
    : "Poloha";

  const locationTitle = hasActiveLocation
    ? `Vaše aktuální poloha: ${locationFullLabel}`
    : "Nastavte svou polohu";

  const inputEmpty = !pickerValue.locationText.trim();

  const primaryButtonLabel = gpsLoading
    ? "Načítám polohu…"
    : inputEmpty
      ? "Použít aktuální polohu"
      : "Použít";

  function handlePrimaryAction() {
    if (inputEmpty) {
      applyGpsLocation();
      return;
    }
    applyPickerLocation();
  }

  useEffect(() => {
    if (!panelOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closePanel();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [closePanel, panelOpen]);

  useEffect(() => {
    if (!panelOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        closePanel();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [closePanel, panelOpen]);

  const showPicker = !hasActiveLocation || editingLocation;

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        {...gtmCtaProps(GTM_CTA.HEADER_LOCATION)}
        aria-expanded={panelOpen}
        aria-haspopup="dialog"
        aria-label={
          hasActiveLocation
            ? `Poloha: ${locationFullLabel}`
            : "Nastavit polohu pro inzeráty v okolí"
        }
        title={locationTitle}
        onClick={togglePanel}
        className={[
          "flex h-10 shrink-0 items-center justify-center rounded-full border transition",
          "w-10 p-0 sm:w-auto sm:max-w-[7.5rem] sm:justify-start sm:gap-1 sm:px-2.5 md:max-w-[9rem]",
          panelOpen || hasActiveLocation
            ? "border-emerald-600 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
            : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100",
        ].join(" ")}
      >
        <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="hidden min-w-0 truncate text-xs font-medium sm:inline md:text-sm">
          {locationLabel}
        </span>
        <ChevronDown
          className={[
            "hidden h-3.5 w-3.5 shrink-0 opacity-60 transition-transform sm:block",
            panelOpen ? "rotate-180" : "",
          ].join(" ")}
          aria-hidden="true"
        />
      </button>

      {panelOpen ? (
        <div
          role="dialog"
          aria-label="Výběr polohy"
          className="absolute top-full right-0 z-50 mt-1.5 w-[min(18rem,calc(100vw-1.5rem))] rounded-xl border border-gray-200 bg-white p-2.5 pr-9 shadow-xl shadow-gray-900/10 sm:p-3 sm:pr-10"
        >
          <button
            type="button"
            aria-label="Zavřít"
            onClick={closePanel}
            className="absolute top-2 right-2 rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </button>

          {showPicker ? (
            <>
              <div className="mt-0.5">
                <LocationInput
                  value={pickerValue}
                  onChange={setPickerValue}
                  inputClass={inputClass}
                  compact
                  label="Kde hledáte inzeráty?"
                  placeholder="Např. Brno, Olomouc..."
                />
              </div>

              {panelError ? (
                <p role="alert" className="mt-1.5 text-xs text-red-700">
                  {panelError}
                </p>
              ) : null}

              <button
                type="button"
                {...gtmCtaProps(
                  inputEmpty ? GTM_CTA.LOCATION_USE_GPS : GTM_CTA.HOME_APPLY_LOCATION,
                )}
                onClick={handlePrimaryAction}
                disabled={gpsLoading}
                className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-70"
              >
                {gpsLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : null}
                {primaryButtonLabel}
              </button>

              <button
                type="button"
                onClick={optOutLocation}
                className="mt-2 w-full text-center text-xs text-gray-500 underline-offset-2 hover:text-gray-700 hover:underline"
              >
                Zobrazit celou ČR
              </button>
            </>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <p className="min-w-0 truncate text-sm font-medium text-gray-900">
                  {locationFullLabel}
                </p>
                <button
                  type="button"
                  onClick={beginChangeLocation}
                  className="shrink-0 text-sm font-medium text-emerald-700 underline-offset-2 hover:underline"
                >
                  Změnit
                </button>
              </div>
              <button
                type="button"
                onClick={optOutLocation}
                className="w-full text-left text-xs text-gray-500 underline-offset-2 hover:text-gray-700 hover:underline"
              >
                Zobrazit celou ČR
              </button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
