import type { CategoryType } from "@/types/post";
import type { LucideIcon } from "lucide-react";
import {
  Apple,
  Baby,
  Bike,
  BookOpen,
  Briefcase,
  Building2,
  CalendarDays,
  Car,
  Cake,
  ClipboardList,
  Code2,
  Flower2,
  Footprints,
  Hammer,
  Handshake,
  Home,
  Landmark,
  Monitor,
  Music2,
  Package,
  Paintbrush,
  Shirt,
  Sofa,
  Store,
  Trees,
  Truck,
  Users,
  UtensilsCrossed,
  Wrench,
} from "lucide-react";

export type ListingDefaultCoverStyle = {
  icon: LucideIcon;
  /** Tailwind třídy jemného pozadí (gradient / solid). */
  surfaceClass: string;
  iconClass: string;
  label: string;
};

const CATEGORY_FALLBACK: Record<CategoryType, ListingDefaultCoverStyle> = {
  auto: {
    icon: Car,
    surfaceClass: "bg-gradient-to-br from-zinc-100 to-zinc-200/70",
    iconClass: "text-zinc-500/65",
    label: "Auto",
  },
  detsky: {
    icon: Baby,
    surfaceClass: "bg-gradient-to-br from-pink-50 to-rose-100/70",
    iconClass: "text-pink-400/70",
    label: "Dětské",
  },
  dum: {
    icon: Sofa,
    surfaceClass: "bg-gradient-to-br from-orange-50/80 to-stone-100",
    iconClass: "text-orange-700/45",
    label: "Dům a zahrada",
  },
  elektro: {
    icon: Monitor,
    surfaceClass: "bg-gradient-to-br from-slate-50 to-slate-200/60",
    iconClass: "text-slate-500/65",
    label: "Elektronika",
  },
  moda: {
    icon: Shirt,
    surfaceClass: "bg-gradient-to-br from-rose-50 to-stone-100",
    iconClass: "text-rose-400/70",
    label: "Móda",
  },
  sport: {
    icon: Bike,
    surfaceClass: "bg-gradient-to-br from-emerald-50 to-stone-100",
    iconClass: "text-emerald-600/55",
    label: "Sport",
  },
  hobby: {
    icon: BookOpen,
    surfaceClass: "bg-gradient-to-br from-indigo-50 to-stone-100",
    iconClass: "text-indigo-400/65",
    label: "Hobby",
  },
  ostatni: {
    icon: Package,
    surfaceClass: "bg-gradient-to-br from-stone-100 to-stone-200/80",
    iconClass: "text-stone-400",
    label: "Ostatní",
  },
  sluzby: {
    icon: Handshake,
    surfaceClass: "bg-gradient-to-br from-teal-50 to-teal-100/70",
    iconClass: "text-teal-500/70",
    label: "Služby",
  },
  udalost: {
    icon: CalendarDays,
    surfaceClass: "bg-gradient-to-br from-sky-50 to-sky-100/70",
    iconClass: "text-sky-500/70",
    label: "Událost",
  },
  nemovitost: {
    icon: Home,
    surfaceClass: "bg-gradient-to-br from-amber-50 to-amber-100/60",
    iconClass: "text-amber-600/60",
    label: "Nemovitost",
  },
  prace: {
    icon: Briefcase,
    surfaceClass: "bg-gradient-to-br from-slate-100 to-slate-200/70",
    iconClass: "text-slate-500/70",
    label: "Práce",
  },
};

const SUBCATEGORY_COVERS: Partial<
  Record<CategoryType, Record<string, ListingDefaultCoverStyle>>
> = {
  auto: {
    "osobni-auta": {
      icon: Car,
      surfaceClass: "bg-gradient-to-br from-zinc-100 to-zinc-200/70",
      iconClass: "text-zinc-500/65",
      label: "Osobní auta",
    },
    motorky: {
      icon: Bike,
      surfaceClass: "bg-gradient-to-br from-zinc-100 to-stone-100",
      iconClass: "text-zinc-500/65",
      label: "Motorky",
    },
    "dily-prislusenstvi": {
      icon: Wrench,
      surfaceClass: "bg-gradient-to-br from-stone-100 to-zinc-100",
      iconClass: "text-stone-500/65",
      label: "Díly",
    },
    ostatni: {
      icon: Car,
      surfaceClass: "bg-gradient-to-br from-zinc-100 to-zinc-200/70",
      iconClass: "text-zinc-500/65",
      label: "Auto",
    },
  },
  detsky: {
    "detske-obleceni-obuv": {
      icon: Shirt,
      surfaceClass: "bg-gradient-to-br from-pink-50 to-rose-50",
      iconClass: "text-pink-400/70",
      label: "Dětské oblečení",
    },
    "kocarky-sedacky-nabytek": {
      icon: Sofa,
      surfaceClass: "bg-gradient-to-br from-pink-50 to-stone-100",
      iconClass: "text-pink-400/60",
      label: "Kočárky",
    },
    "hracky-miminka": {
      icon: Baby,
      surfaceClass: "bg-gradient-to-br from-rose-50 to-pink-50",
      iconClass: "text-rose-400/65",
      label: "Hračky",
    },
    ostatni: {
      icon: Baby,
      surfaceClass: "bg-gradient-to-br from-pink-50 to-rose-100/70",
      iconClass: "text-pink-400/70",
      label: "Dětské",
    },
  },
  dum: {
    "nabytek-doplnky": {
      icon: Sofa,
      surfaceClass: "bg-gradient-to-br from-orange-50/80 to-stone-100",
      iconClass: "text-orange-700/45",
      label: "Nábytek",
    },
    "zahrada-naradi": {
      icon: Flower2,
      surfaceClass: "bg-gradient-to-br from-green-50 to-stone-100",
      iconClass: "text-green-600/55",
      label: "Zahrada",
    },
    "potraviny-domaci": {
      icon: Apple,
      surfaceClass: "bg-gradient-to-br from-lime-50 to-stone-100",
      iconClass: "text-lime-700/50",
      label: "Potraviny",
    },
    ostatni: {
      icon: Sofa,
      surfaceClass: "bg-gradient-to-br from-orange-50/80 to-stone-100",
      iconClass: "text-orange-700/45",
      label: "Dům a zahrada",
    },
  },
  elektro: {
    mobily: {
      icon: Monitor,
      surfaceClass: "bg-gradient-to-br from-slate-50 to-slate-200/60",
      iconClass: "text-slate-500/65",
      label: "Mobily",
    },
    pc: {
      icon: Monitor,
      surfaceClass: "bg-gradient-to-br from-slate-50 to-sky-50",
      iconClass: "text-slate-500/65",
      label: "Počítače",
    },
    "tv-foto-audio": {
      icon: Monitor,
      surfaceClass: "bg-gradient-to-br from-slate-50 to-indigo-50",
      iconClass: "text-slate-500/65",
      label: "TV a audio",
    },
    spotrebice: {
      icon: Monitor,
      surfaceClass: "bg-gradient-to-br from-slate-50 to-stone-100",
      iconClass: "text-slate-500/65",
      label: "Spotřebiče",
    },
    ostatni: {
      icon: Monitor,
      surfaceClass: "bg-gradient-to-br from-slate-50 to-slate-200/60",
      iconClass: "text-slate-500/65",
      label: "Elektronika",
    },
  },
  moda: {
    "damske-panske": {
      icon: Shirt,
      surfaceClass: "bg-gradient-to-br from-rose-50 to-stone-100",
      iconClass: "text-rose-400/70",
      label: "Oblečení",
    },
    "boty-doplnky": {
      icon: Footprints,
      surfaceClass: "bg-gradient-to-br from-rose-50 to-stone-50",
      iconClass: "text-rose-400/65",
      label: "Boty a doplňky",
    },
    ostatni: {
      icon: Shirt,
      surfaceClass: "bg-gradient-to-br from-rose-50 to-stone-100",
      iconClass: "text-rose-400/70",
      label: "Móda",
    },
  },
  sport: {
    "kola-kolobezky": {
      icon: Bike,
      surfaceClass: "bg-gradient-to-br from-emerald-50 to-stone-100",
      iconClass: "text-emerald-600/55",
      label: "Kola",
    },
    "zimni-sport": {
      icon: Footprints,
      surfaceClass: "bg-gradient-to-br from-sky-50 to-emerald-50",
      iconClass: "text-sky-500/60",
      label: "Zimní sport",
    },
    ostatni: {
      icon: Bike,
      surfaceClass: "bg-gradient-to-br from-emerald-50 to-stone-100",
      iconClass: "text-emerald-600/55",
      label: "Sport",
    },
  },
  hobby: {
    "knihy-hry-hudba": {
      icon: BookOpen,
      surfaceClass: "bg-gradient-to-br from-indigo-50 to-stone-100",
      iconClass: "text-indigo-400/65",
      label: "Knihy a hry",
    },
    "sberatelstvi-umeni": {
      icon: Paintbrush,
      surfaceClass: "bg-gradient-to-br from-violet-50 to-stone-100",
      iconClass: "text-violet-400/65",
      label: "Sběratelství",
    },
    ostatni: {
      icon: BookOpen,
      surfaceClass: "bg-gradient-to-br from-indigo-50 to-stone-100",
      iconClass: "text-indigo-400/65",
      label: "Hobby",
    },
  },
  ostatni: {
    ostatni: {
      icon: Package,
      surfaceClass: "bg-gradient-to-br from-stone-100 to-stone-200/80",
      iconClass: "text-stone-400",
      label: "Ostatní",
    },
  },
  sluzby: {
    "remeslo-opravy": {
      icon: Wrench,
      surfaceClass: "bg-gradient-to-br from-teal-50 to-stone-100",
      iconClass: "text-teal-600/55",
      label: "Řemeslo",
    },
    "stehovani-doprava": {
      icon: Truck,
      surfaceClass: "bg-gradient-to-br from-cyan-50 to-stone-100",
      iconClass: "text-cyan-600/55",
      label: "Stěhování",
    },
    "pece-zahrada": {
      icon: Flower2,
      surfaceClass: "bg-gradient-to-br from-green-50 to-stone-100",
      iconClass: "text-green-600/55",
      label: "Péče a zahrada",
    },
    ostatni: {
      icon: Handshake,
      surfaceClass: "bg-gradient-to-br from-teal-50 to-teal-100/70",
      iconClass: "text-teal-500/70",
      label: "Služby",
    },
  },
  udalost: {
    koncert: {
      icon: Music2,
      surfaceClass: "bg-gradient-to-br from-indigo-50 to-sky-50",
      iconClass: "text-indigo-400/65",
      label: "Koncert",
    },
    narozeniny: {
      icon: Cake,
      surfaceClass: "bg-gradient-to-br from-pink-50 to-sky-50",
      iconClass: "text-pink-400/65",
      label: "Narozeniny",
    },
    opekani: {
      icon: UtensilsCrossed,
      surfaceClass: "bg-gradient-to-br from-orange-50 to-sky-50",
      iconClass: "text-orange-500/55",
      label: "Opékání",
    },
    sport: {
      icon: Footprints,
      surfaceClass: "bg-gradient-to-br from-emerald-50 to-sky-50",
      iconClass: "text-emerald-600/55",
      label: "Sport",
    },
    workshop: {
      icon: Paintbrush,
      surfaceClass: "bg-gradient-to-br from-stone-50 to-sky-50",
      iconClass: "text-stone-500/60",
      label: "Workshop",
    },
    setkani: {
      icon: Users,
      surfaceClass: "bg-gradient-to-br from-sky-50 to-sky-100/70",
      iconClass: "text-sky-500/65",
      label: "Setkání",
    },
    ostatni: {
      icon: CalendarDays,
      surfaceClass: "bg-gradient-to-br from-sky-50 to-sky-100/70",
      iconClass: "text-sky-500/70",
      label: "Událost",
    },
  },
  nemovitost: {
    byty: {
      icon: Building2,
      surfaceClass: "bg-gradient-to-br from-amber-50 to-stone-100",
      iconClass: "text-amber-700/50",
      label: "Byt",
    },
    domy: {
      icon: Home,
      surfaceClass: "bg-gradient-to-br from-amber-50 to-stone-100",
      iconClass: "text-amber-700/50",
      label: "Dům",
    },
    pozemky: {
      icon: Trees,
      surfaceClass: "bg-gradient-to-br from-lime-50 to-amber-50",
      iconClass: "text-lime-700/45",
      label: "Pozemek",
    },
    "chata-chalupa": {
      icon: Home,
      surfaceClass: "bg-gradient-to-br from-yellow-50 to-amber-50",
      iconClass: "text-yellow-700/50",
      label: "Chata",
    },
    komercni: {
      icon: Store,
      surfaceClass: "bg-gradient-to-br from-stone-100 to-amber-50",
      iconClass: "text-stone-500/65",
      label: "Komerční",
    },
    ostatni: {
      icon: Landmark,
      surfaceClass: "bg-gradient-to-br from-amber-50 to-amber-100/60",
      iconClass: "text-amber-600/60",
      label: "Nemovitost",
    },
  },
  prace: {
    "brigady-jednorazove": {
      icon: ClipboardList,
      surfaceClass: "bg-gradient-to-br from-slate-100 to-slate-200/60",
      iconClass: "text-slate-500/65",
      label: "Brigáda",
    },
    "retail-pohostinstvi": {
      icon: Store,
      surfaceClass: "bg-gradient-to-br from-slate-100 to-stone-100",
      iconClass: "text-slate-500/65",
      label: "Retail",
    },
    administrativa: {
      icon: ClipboardList,
      surfaceClass: "bg-gradient-to-br from-slate-50 to-slate-200/50",
      iconClass: "text-slate-500/65",
      label: "Administrativa",
    },
    "it-digital": {
      icon: Code2,
      surfaceClass: "bg-gradient-to-br from-sky-50 to-slate-100",
      iconClass: "text-sky-600/55",
      label: "IT",
    },
    "remeslo-stavba": {
      icon: Hammer,
      surfaceClass: "bg-gradient-to-br from-orange-50 to-slate-100",
      iconClass: "text-orange-700/45",
      label: "Řemeslo",
    },
    "pece-zahrada": {
      icon: Flower2,
      surfaceClass: "bg-gradient-to-br from-green-50 to-slate-100",
      iconClass: "text-green-600/55",
      label: "Péče",
    },
    ostatni: {
      icon: Briefcase,
      surfaceClass: "bg-gradient-to-br from-slate-100 to-slate-200/70",
      iconClass: "text-slate-500/70",
      label: "Práce",
    },
  },
};

/** Jemné výchozí ilustrace karty/detailu, když inzerát nemá fotku. */
export function getListingDefaultCover(
  categoryType: CategoryType,
  subcategorySlug: string,
): ListingDefaultCoverStyle {
  return (
    SUBCATEGORY_COVERS[categoryType]?.[subcategorySlug] ??
    CATEGORY_FALLBACK[categoryType]
  );
}
