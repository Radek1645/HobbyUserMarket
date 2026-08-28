import {
  formatHeaderLocation,
  formatPublicListingLocation,
} from "@/lib/posts/format-public-location";
import type { MapyGeocodeEntity, MapyLocationSelection } from "@/lib/mapy/types";

/** Alias pro filtr polohy návštěvníka na homepage. */
export function formatPublicAreaLocation(locationText: string): string {
  return formatPublicListingLocation(locationText);
}

/** Kompaktní štítek polohy do headeru. */
export function formatHeaderAreaLocation(locationText: string): string {
  return formatHeaderLocation(locationText);
}

/** Obec/město z Mapy `location` řetězce (první segment, bez „- město“). */
function municipalityFromMapyLocation(location?: string): string | null {
  if (!location) return null;
  const withoutCountry = location.replace(/,?\s*Česko\s*$/i, "").trim();
  const [first] = withoutCountry.split(",").map((part) => part.trim());
  if (!first) return null;
  return first.replace(/\s*-\s*město$/i, "").trim() || null;
}

/** Kontextová nápověda v našeptávači (např. kraj u obce). */
export function formatMapyLocationLabel(entity: MapyGeocodeEntity): string {
  const name = entity.name.trim();
  const municipality = municipalityFromMapyLocation(entity.location);

  if (
    entity.type === "regional.municipality" ||
    entity.type === "regional.municipality_part"
  ) {
    if (municipality && municipality !== name) {
      return `${name}, ${municipality}`;
    }
    return name || municipality || "";
  }

  if (
    (entity.type === "regional.address" || entity.type === "regional.street") &&
    municipality &&
    name !== municipality
  ) {
    return `${name}, ${municipality}`;
  }

  return name || municipality || "";
}

/** Krátký název pro uložení do `location_text` (ulice/obec + město, ne kraj). */
export function locationTextFromEntity(entity: MapyGeocodeEntity): string {
  return formatMapyLocationLabel(entity);
}

export function entityToLocationSelection(
  entity: MapyGeocodeEntity,
): MapyLocationSelection {
  return {
    locationText: locationTextFromEntity(entity),
    latitude: entity.position.lat,
    longitude: entity.position.lon,
  };
}
