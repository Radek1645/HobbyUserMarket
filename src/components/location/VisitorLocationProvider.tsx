"use client";

import {
  formatPublicAreaLocation,
  MapyApiError,
  reverseGeocodeLocation,
} from "@/lib/mapy/client";
import {
  clearLocationPromptDismissed,
  clearVisitorLocation,
  loadLocationPromptDismissed,
  loadSearchByLocation,
  loadVisitorLocation,
  saveLocationPromptDismissed,
  saveSearchByLocation,
  saveVisitorLocation,
  type VisitorLocation,
} from "@/lib/posts/visitor-location";
import {
  notifyVisitorLocationChanged,
  requestVisitorLocationPanelOpen,
  VISITOR_LOCATION_PANEL_OPEN,
} from "@/lib/posts/visitor-location-events";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type PickerValue = {
  locationText: string;
  latitude: number | null;
  longitude: number | null;
};

type VisitorLocationContextValue = {
  location: VisitorLocation | null;
  locationEnabled: boolean;
  ready: boolean;
  panelOpen: boolean;
  editingLocation: boolean;
  pickerValue: PickerValue;
  setPickerValue: (value: PickerValue) => void;
  panelError: string | null;
  gpsLoading: boolean;
  togglePanel: () => void;
  closePanel: () => void;
  applyPickerLocation: () => void;
  applyGpsLocation: () => void;
  beginChangeLocation: () => void;
  optOutLocation: () => void;
};

const VisitorLocationContext = createContext<VisitorLocationContextValue | null>(
  null,
);

const EMPTY_PICKER: PickerValue = {
  locationText: "",
  latitude: null,
  longitude: null,
};

export function VisitorLocationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [location, setLocation] = useState<VisitorLocation | null>(null);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [ready, setReady] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState(false);
  const [pickerValue, setPickerValue] = useState<PickerValue>(EMPTY_PICKER);
  const [panelError, setPanelError] = useState<string | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  const closePanel = useCallback(() => {
    setPanelOpen(false);
    setEditingLocation(false);
    setPanelError(null);
    saveLocationPromptDismissed();
  }, []);

  const openPanel = useCallback(() => {
    setPanelOpen(true);
    setEditingLocation(true);
    setPanelError(null);
  }, []);

  const togglePanel = useCallback(() => {
    setPanelOpen((open) => {
      const next = !open;
      if (next) {
        setEditingLocation(location == null || !locationEnabled);
      }
      setPanelError(null);
      return next;
    });
  }, [location, locationEnabled]);

  const persistLocation = useCallback((next: VisitorLocation) => {
    saveSearchByLocation(true);
    clearLocationPromptDismissed();
    saveVisitorLocation(next);
    setLocation(next);
    setLocationEnabled(true);
    setPanelError(null);
    setEditingLocation(false);
    setPanelOpen(false);
    notifyVisitorLocationChanged();
  }, []);

  const applyPickerLocation = useCallback(() => {
    if (
      pickerValue.latitude == null ||
      pickerValue.longitude == null ||
      !pickerValue.locationText.trim()
    ) {
      setPanelError("Vyber obec z našeptávače.");
      return;
    }

    const next: VisitorLocation = {
      locationText: formatPublicAreaLocation(pickerValue.locationText),
      latitude: pickerValue.latitude,
      longitude: pickerValue.longitude,
    };

    persistLocation(next);
  }, [persistLocation, pickerValue]);

  const applyGpsLocation = useCallback(() => {
    setPanelError(null);

    if (!navigator.geolocation) {
      setPanelError("Prohlížeč nepodporuje geolokaci.");
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const selection = await reverseGeocodeLocation(
            position.coords.latitude,
            position.coords.longitude,
            undefined,
            { approximate: true },
          );
          persistLocation({
            locationText: formatPublicAreaLocation(selection.locationText),
            latitude: selection.latitude,
            longitude: selection.longitude,
          });
        } catch (err) {
          if (err instanceof MapyApiError) {
            setPanelError(err.message);
          } else {
            persistLocation({
              locationText: "Moje poloha",
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          }
        } finally {
          setGpsLoading(false);
        }
      },
      () => {
        setPanelError("Polohu se nepodařilo získat. Povol GPS v prohlížeči.");
        setGpsLoading(false);
      },
      { enableHighAccuracy: false, timeout: 12_000, maximumAge: 300_000 },
    );
  }, [persistLocation]);

  const optOutLocation = useCallback(() => {
    clearVisitorLocation();
    saveSearchByLocation(false);
    saveLocationPromptDismissed();
    setLocation(null);
    setLocationEnabled(false);
    setPickerValue(EMPTY_PICKER);
    setPanelError(null);
    setEditingLocation(false);
    setPanelOpen(false);
    notifyVisitorLocationChanged();
  }, []);

  const beginChangeLocation = useCallback(() => {
    if (location) {
      setPickerValue({
        locationText: location.locationText,
        latitude: location.latitude,
        longitude: location.longitude,
      });
    } else {
      setPickerValue(EMPTY_PICKER);
    }
    setEditingLocation(true);
    setPanelError(null);
  }, [location]);

  useEffect(() => {
    function handleOpenRequest() {
      openPanel();
    }

    window.addEventListener(VISITOR_LOCATION_PANEL_OPEN, handleOpenRequest);
    return () => {
      window.removeEventListener(VISITOR_LOCATION_PANEL_OPEN, handleOpenRequest);
    };
  }, [openPanel]);

  useEffect(() => {
    const searchEnabled = loadSearchByLocation();
    setLocationEnabled(searchEnabled);

    if (!searchEnabled) {
      setReady(true);
      return;
    }

    const saved = loadVisitorLocation();
    if (saved) {
      setLocation(saved);
      setPickerValue({
        locationText: saved.locationText,
        latitude: saved.latitude,
        longitude: saved.longitude,
      });
      setReady(true);
      return;
    }

    setReady(true);

    if (!loadLocationPromptDismissed()) {
      setEditingLocation(true);
      setPanelOpen(true);
    }
  }, []);

  const value = useMemo(
    () => ({
      location,
      locationEnabled,
      ready,
      panelOpen,
      editingLocation,
      pickerValue,
      setPickerValue,
      panelError,
      gpsLoading,
      togglePanel,
      closePanel,
      applyPickerLocation,
      applyGpsLocation,
      beginChangeLocation,
      optOutLocation,
    }),
    [
      location,
      locationEnabled,
      ready,
      panelOpen,
      editingLocation,
      pickerValue,
      panelError,
      gpsLoading,
      togglePanel,
      closePanel,
      applyPickerLocation,
      applyGpsLocation,
      beginChangeLocation,
      optOutLocation,
    ],
  );

  return (
    <VisitorLocationContext.Provider value={value}>
      {children}
    </VisitorLocationContext.Provider>
  );
}

export function useVisitorLocationContext(): VisitorLocationContextValue {
  const ctx = useContext(VisitorLocationContext);
  if (!ctx) {
    throw new Error(
      "useVisitorLocationContext must be used within VisitorLocationProvider",
    );
  }
  return ctx;
}

export { requestVisitorLocationPanelOpen, notifyVisitorLocationChanged };
