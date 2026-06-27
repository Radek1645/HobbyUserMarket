export type MapyCoordinates = {
  lon: number;
  lat: number;
};

export type MapyGeocodeEntity = {
  name: string;
  label: string;
  position: MapyCoordinates;
  type: string;
  location?: string;
};

export type MapyGeocodeResponse = {
  items: MapyGeocodeEntity[];
};

export type MapyRgeocodeResponse = {
  items: MapyGeocodeEntity[];
};

export type MapyLocationSelection = {
  locationText: string;
  latitude: number;
  longitude: number;
};
