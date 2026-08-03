import type { CategoryType } from "@/types/post";
import type { HomeBrowseCategory } from "@/config/home-themes";
import {
  Baby,
  Bike,
  BookOpen,
  Briefcase,
  Building,
  Calendar,
  Car,
  Home,
  Layers,
  LayoutGrid,
  Monitor,
  Package,
  Shirt,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export const SERVICES_BUNDLE_TYPES = [
  "sluzby",
  "prace",
  "nemovitost",
] as const satisfies readonly CategoryType[];

export type ServicesBundleType = (typeof SERVICES_BUNDLE_TYPES)[number];

export function isServicesBundleCategory(
  category: string | null | undefined,
): category is ServicesBundleType {
  return (
    !!category &&
    (SERVICES_BUNDLE_TYPES as readonly string[]).includes(category)
  );
}

export type CategoryGridMember = {
  id: CategoryType;
  label: string;
  icon: LucideIcon;
};

export type CategoryGridDirectTile = {
  kind: "direct";
  id: HomeBrowseCategory;
  label: string;
  icon: LucideIcon;
};

export type CategoryGridBundleTile = {
  kind: "bundle";
  id: "services-bundle";
  label: string;
  icon: LucideIcon;
  members: CategoryGridMember[];
};

export type CategoryGridTile = CategoryGridDirectTile | CategoryGridBundleTile;

const SERVICES_BUNDLE: CategoryGridBundleTile = {
  kind: "bundle",
  id: "services-bundle",
  label: "Služby, práce a reality",
  icon: Layers,
  members: [
    { id: "sluzby", label: "Služby", icon: Wrench },
    { id: "prace", label: "Práce", icon: Briefcase },
    { id: "nemovitost", label: "Nemovitosti", icon: Building },
  ],
};

/** Mřížka na HP — Vše + zbožové domény + bundle + Události. */
export const HOME_CATEGORY_GRID_TILES: CategoryGridTile[] = [
  { kind: "direct", id: "all", label: "Vše", icon: LayoutGrid },
  { kind: "direct", id: "auto", label: "Auto-moto", icon: Car },
  { kind: "direct", id: "detsky", label: "Dětský bazar", icon: Baby },
  { kind: "direct", id: "dum", label: "Dům a zahrada", icon: Home },
  { kind: "direct", id: "elektro", label: "Elektro", icon: Monitor },
  { kind: "direct", id: "moda", label: "Móda", icon: Shirt },
  { kind: "direct", id: "sport", label: "Sport", icon: Bike },
  { kind: "direct", id: "hobby", label: "Hobby", icon: BookOpen },
  { kind: "direct", id: "ostatni", label: "Ostatní", icon: Package },
  SERVICES_BUNDLE,
  { kind: "direct", id: "udalost", label: "Události", icon: Calendar },
];

/** Mřížka ve formuláři — bez Vše. */
export const CREATE_LISTING_CATEGORY_GRID_TILES: CategoryGridTile[] =
  HOME_CATEGORY_GRID_TILES.filter(
    (tile) => !(tile.kind === "direct" && tile.id === "all"),
  );
