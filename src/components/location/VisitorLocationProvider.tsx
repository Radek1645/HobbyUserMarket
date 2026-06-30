"use client";

import {
  formatPublicAreaLocation,
  reverseGeocodeLocation,
} from "@/lib/mapy/client";
import {
  clearVisitorLocation,
  loadVisitorLocation,
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
  ready: boolean;
  panelOpen: boolean;
  pickerValue: PickerValue;
  setPickerValue: (value: PickerValue) => void;
  panelError: string | null;
  togglePanel: () => void;
  closePanel: () => void;
  applyPickerLocation: () => void;
  beginChangeLocation: () => void;
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
  const [ready, setReady] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [pickerValue, setPickerValue] = useState<PickerValue>(EMPTY_PICKER);
  const [panelError, setPanelError] = useState<string | null>(null);

  const closePanel = useCallback(() => {
    setPanelOpen(false);
    setPanelError(null);
  }, []);

  const openPanel = useCallback(() => {
    setPanelOpen(true);
    setPanelError(null);
  }, []);

  const togglePanel = useCallback(() => {
    setPanelOpen((open) => !open);
    setPanelError(null);
  }, []);

  const applyPickerLocation = useCallback(() => {
    if (
      pickerValue.latitude == null ||
      pickerValue.longitude == null ||
      !pickerValue.locationText.trim()
    ) {
      setPanelError("Vyber obec z našeptávače nebo použij GPS.");
      return;
    }

    const next: VisitorLocation = {
      locationText: formatPublicAreaLocation(pickerValue.locationText),
      latitude: pickerValue.latitude,
      longitude: pickerValue.longitude,
    };

    saveVisitorLocation(next);
    setLocation(next);
    setPanelError(null);
    setPanelOpen(false);
    notifyVisitorLocationChanged();
  }, [pickerValue]);

  const beginChangeLocation = useCallback(() => {
    clearVisitorLocation();
    setLocation(null);
    setPickerValue(EMPTY_PICKER);
    setPanelError(null);
    setPanelOpen(true);
    notifyVisitorLocationChanged();
  }, []);

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

    if (!navigator.geolocation) {
      setReady(true);
      setPanelOpen(true);
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
          setPickerValue({
            locationText: loc.locationText,
            latitude: loc.latitude,
            longitude: loc.longitude,
          });
          notifyVisitorLocationChanged();
        } catch {
          const loc: VisitorLocation = {
            locationText: "Moje poloha",
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          saveVisitorLocation(loc);
          setLocation(loc);
          setPickerValue({
            locationText: loc.locationText,
            latitude: loc.latitude,
            longitude: loc.longitude,
          });
          notifyVisitorLocationChanged();
        } finally {
          setReady(true);
        }
      },
      () => {
        setReady(true);
        setPanelOpen(true);
      },
      { enableHighAccuracy: false, timeout: 12_000, maximumAge: 300_000 },
    );
  }, []);

  const value = useMemo(
    () => ({
      location,
      ready,
      panelOpen,
      pickerValue,
      setPickerValue,
      panelError,
      togglePanel,
      closePanel,
      applyPickerLocation,
      beginChangeLocation,
    }),
    [
      location,
      ready,
      panelOpen,
      pickerValue,
      panelError,
      togglePanel,
      closePanel,
      applyPickerLocation,
      beginChangeLocation,
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
