"use client";

import {
  entityToLocationSelection,
  formatMapyLocationLabel,
  MapyApiError,
  reverseGeocodeLocation,
  suggestPlaces,
} from "@/lib/mapy/client";
import { GTM_CTA, gtmCtaProps } from "@/config/gtm-ids";
import {
  listingFormHintClass,
  listingFormInputClass,
  listingFormLabelClass,
  listingFormRequiredMarkClass,
} from "@/config/listing-form-ui";
import type { MapyGeocodeEntity } from "@/lib/mapy/types";
import { Loader2, MapPin } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

export type LocationInputValue = {
  locationText: string;
  latitude: number | null;
  longitude: number | null;
};

type LocationInputProps = {
  value: LocationInputValue;
  onChange: (value: LocationInputValue) => void;
  inputClass?: string;
  labelClass?: string;
  compact?: boolean;
  label?: string;
  placeholder?: string;
  /** Při úpravě inzerátu zvýrazní nutnost potvrdit lokalitu z našeptávače. */
  requireConfirmation?: boolean;
};

const DEBOUNCE_MS = 300;

export function LocationInput({
  value,
  onChange,
  inputClass = listingFormInputClass,
  labelClass = listingFormLabelClass,
  compact = false,
  label,
  placeholder,
  requireConfirmation = false,
}: LocationInputProps) {
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [suggestions, setSuggestions] = useState<MapyGeocodeEntity[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSuggestLoading, setIsSuggestLoading] = useState(false);
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  const isResolved =
    value.latitude != null &&
    value.longitude != null &&
    value.locationText.trim().length > 0;

  const isEmpty = value.locationText.trim().length === 0;

  const clearPendingSuggest = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  useEffect(() => () => clearPendingSuggest(), [clearPendingSuggest]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleInputChange(text: string) {
    setError(null);
    onChange({
      locationText: text,
      latitude: null,
      longitude: null,
    });

    clearPendingSuggest();

    if (text.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      setIsSuggestLoading(false);
      return;
    }

    setIsSuggestLoading(true);
    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const items = await suggestPlaces(text, controller.signal);
        setSuggestions(items);
        setActiveIndex(items.length > 0 ? 0 : -1);
        setIsOpen(items.length > 0);
        setError(null);
      } catch (err) {
        if (controller.signal.aborted) return;
        if (err instanceof MapyApiError) {
          setError(err.message);
        } else {
          setError("Našeptávač lokality teď nefunguje.");
        }
        setSuggestions([]);
        setIsOpen(false);
      } finally {
        if (!controller.signal.aborted) {
          setIsSuggestLoading(false);
        }
      }
    }, DEBOUNCE_MS);
  }

  function selectSuggestion(item: MapyGeocodeEntity) {
    clearPendingSuggest();
    const selection = entityToLocationSelection(item);
    onChange({
      locationText: selection.locationText,
      latitude: selection.latitude,
      longitude: selection.longitude,
    });
    setSuggestions([]);
    setActiveIndex(-1);
    setIsOpen(false);
    setError(null);
  }

  function handleComboboxKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!isOpen || suggestions.length === 0) {
      if (event.key === "ArrowDown" && suggestions.length > 0) {
        setIsOpen(true);
        setActiveIndex(0);
        event.preventDefault();
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) =>
        current < suggestions.length - 1 ? current + 1 : 0,
      );
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) =>
        current > 0 ? current - 1 : suggestions.length - 1,
      );
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(suggestions.length - 1);
      return;
    }
    if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      const item = suggestions[activeIndex];
      if (item) selectSuggestion(item);
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
      setActiveIndex(-1);
    }
  }

  function useCurrentLocation() {
    setError(null);

    if (!navigator.geolocation) {
      setError("Prohlížeč nepodporuje geolokaci.");
      return;
    }

    setIsGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const controller = new AbortController();
        abortRef.current = controller;

        try {
          const selection = await reverseGeocodeLocation(
            latitude,
            longitude,
            controller.signal,
          );
          onChange({
            locationText: selection.locationText,
            latitude: selection.latitude,
            longitude: selection.longitude,
          });
          setSuggestions([]);
          setIsOpen(false);
          setError(null);
        } catch (err) {
          if (controller.signal.aborted) return;
          if (err instanceof MapyApiError) {
            setError(err.message);
          } else {
            setError("Polohu se nepodařilo převést na název obce.");
          }
        } finally {
          setIsGpsLoading(false);
        }
      },
      () => {
        setError("Polohu se nepodařilo získat. Povolte GPS v prohlížeči.");
        setIsGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  return (
    <div ref={containerRef}>
      {!compact ? (
        <label htmlFor="locationText" className={labelClass}>
          Lokalita inzerátu
          <span className={listingFormRequiredMarkClass} aria-hidden="true">
            *
          </span>
        </label>
      ) : label ? (
        <label htmlFor="locationText" className="mb-1 block text-sm font-medium text-gray-900">
          {label}
        </label>
      ) : null}
      <div className="relative">
        <input
          id="locationText"
          name="locationText"
          type="text"
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            isOpen && activeIndex >= 0
              ? `${listId}-option-${activeIndex}`
              : undefined
          }
          aria-label={compact && !label ? "Obec nebo město" : undefined}
          value={value.locationText}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleComboboxKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          className={[
            inputClass,
            !compact ? "pr-10" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          placeholder={
            placeholder ??
            (compact ? "Obec nebo město…" : "Přehradní, Brno…")
          }
        />
        {!compact ? (
          isGpsLoading || isSuggestLoading ? (
            <Loader2
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400"
              aria-hidden="true"
            />
          ) : (
            <button
              type="button"
              {...gtmCtaProps(GTM_CTA.LOCATION_USE_GPS)}
              onClick={useCurrentLocation}
              title="Jsem právě na místě — doplnit z GPS"
              aria-label="Jsem právě na místě — doplnit z GPS"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/35"
            >
              <MapPin className="h-4 w-4" aria-hidden="true" />
            </button>
          )
        ) : null}
        {compact && isSuggestLoading ? (
          <Loader2
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400"
            aria-hidden="true"
          />
        ) : null}

        {isOpen && suggestions.length > 0 ? (
          <ul
            id={listId}
            role="listbox"
            className={[
              "absolute z-20 mt-1 w-full overflow-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg",
              compact ? "max-h-40" : "max-h-56",
            ].join(" ")}
          >
            {suggestions.map((item, index) => (
              <li key={`${item.type}-${item.name}-${item.position.lon}`}>
                <button
                  type="button"
                  id={`${listId}-option-${index}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  {...gtmCtaProps(GTM_CTA.LOCATION_SELECT_SUGGESTION)}
                  className={`w-full px-3 py-2 text-left text-sm ${
                    index === activeIndex ? "bg-gray-100" : "hover:bg-gray-50"
                  }`}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectSuggestion(item)}
                >
                  <span className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{item.name}</span>
                    {item.label ? (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                        {item.label}
                      </span>
                    ) : null}
                  </span>
                  {item.location && item.location !== item.name ? (
                    <span className="mt-0.5 block text-xs text-gray-500">
                      {formatMapyLocationLabel(item)}
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {!compact ? (
        <div className="mt-1 space-y-1">
          {isResolved ? (
            <p className="text-xs text-green-700">
              Lokalita potvrzena: {value.locationText}
            </p>
          ) : requireConfirmation ? (
            <p className="text-sm font-medium text-red-600">
              {isEmpty
                ? "Zadejte a potvrďte lokalitu inzerátu z našeptávače."
                : "Potvrďte lokalitu inzerátu"}
            </p>
          ) : isEmpty ? (
            <p className={listingFormHintClass}>
              Zadejte město, abychom inzerát správně spárovali.
            </p>
          ) : (
            <p className={listingFormHintClass}>
              Našeptávač vám pomůže vybrat správnou obec.
            </p>
          )}
        </div>
      ) : null}

      {error ? (
        <p className={compact ? "mt-1.5 text-xs text-red-600" : "mt-1 text-xs text-red-600"}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
