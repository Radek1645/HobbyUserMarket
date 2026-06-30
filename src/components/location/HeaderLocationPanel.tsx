"use client";

import { LocationInput } from "@/components/listing/LocationInput";
import { useVisitorLocationContext } from "@/components/location/VisitorLocationProvider";
import { GTM_CTA, gtmCtaProps } from "@/config/gtm-ids";
import { formatPublicAreaLocation } from "@/lib/mapy/client";
import { X } from "lucide-react";
import { useEffect } from "react";

const inputClass =
  "mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-200";

const labelClass = "block text-sm font-medium text-gray-700";

export function HeaderLocationPanel() {
  const {
    location,
    panelOpen,
    closePanel,
    pickerValue,
    setPickerValue,
    panelError,
    applyPickerLocation,
    beginChangeLocation,
  } = useVisitorLocationContext();

  useEffect(() => {
    if (!panelOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closePanel();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [closePanel, panelOpen]);

  if (!panelOpen) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Zavřít výběr polohy"
        className="fixed inset-0 top-14 z-40 bg-black/20"
        onClick={closePanel}
      />

      <div className="fixed inset-x-0 top-14 z-50 border-b border-gray-200 bg-white shadow-lg">
        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900">
                Poloha pro inzeráty v okolí
              </p>
              <p className="mt-1 text-sm text-gray-600">
                Vyber obec nebo povol GPS — inzeráty se seřadí podle vzdálenosti.
              </p>
            </div>
            <button
              type="button"
              aria-label="Zavřít"
              onClick={closePanel}
              className="shrink-0 rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {location ? (
            <p className="mt-3 text-sm text-gray-700">
              Aktuálně:{" "}
              <span className="font-medium text-gray-900">
                {formatPublicAreaLocation(location.locationText)}
              </span>
              <button
                type="button"
                onClick={beginChangeLocation}
                className="ml-2 text-sm font-medium text-emerald-700 underline-offset-2 hover:underline"
              >
                Změnit
              </button>
            </p>
          ) : null}

          <div className="mt-3">
            <LocationInput
              value={pickerValue}
              onChange={setPickerValue}
              inputClass={inputClass}
              labelClass={labelClass}
            />
          </div>

          {panelError ? (
            <p role="alert" className="mt-2 text-sm text-red-700">
              {panelError}
            </p>
          ) : null}

          <button
            type="button"
            {...gtmCtaProps(GTM_CTA.HOME_APPLY_LOCATION)}
            onClick={applyPickerLocation}
            className="mt-4 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            {location ? "Uložit polohu" : "Zobrazit inzeráty v okolí"}
          </button>
        </div>
      </div>
    </>
  );
}
