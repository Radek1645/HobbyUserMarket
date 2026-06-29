import type { CategoryType } from "@/types/post";

/** Filtr homepage — null = všechny kategorie */
export type HomeBrowseCategory = CategoryType | "all";

export type HomeTheme = {
  label: string;
  headline: string;
  subline: string;
  /** Jemné pozadí celé stránky */
  shellClass: string;
  /** Hero karta */
  heroClass: string;
  heroBorderClass: string;
  accentClass: string;
  tabActiveClass: string;
  tabInactiveClass: string;
  /** Primární CTA (Založit inzerát, akce ve formuláři) */
  ctaClass: string;
};

export const HOME_CATEGORY_ORDER: HomeBrowseCategory[] = [
  "all",
  "zbozi",
  "sluzby",
  "prace",
  "nemovitost",
  "udalost",
];

export const HOME_THEMES: Record<HomeBrowseCategory, HomeTheme> = {
  all: {
    label: "Vše",
    headline: "Lokální inzerce ve tvém okolí",
    subline:
      "Zboží, služby, práce, události a nemovitosti od lidí poblíž — bez složité registrace.",
    shellClass: "bg-zinc-50",
    heroClass: "bg-white",
    heroBorderClass: "border-zinc-200",
    accentClass: "text-zinc-900",
    tabActiveClass: "bg-zinc-800 text-white border-zinc-800 shadow-sm shadow-zinc-800/10",
    tabInactiveClass:
      "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300 hover:text-zinc-900",
    ctaClass: "bg-zinc-800 text-white hover:bg-zinc-700",
  },
  zbozi: {
    label: "Zboží",
    headline: "Nakupuj a prodávej u sousedů",
    subline:
      "Od medu po kolo — věci z okolí, bez zbytečné omáčky a provizí.",
    shellClass: "bg-emerald-50/40",
    heroClass: "bg-white/80 backdrop-blur-md",
    heroBorderClass: "border-emerald-200/60",
    accentClass: "text-emerald-800",
    tabActiveClass:
      "bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/10",
    tabInactiveClass:
      "bg-white text-emerald-700/80 border-emerald-200/50 hover:border-emerald-300 hover:text-emerald-900",
    ctaClass: "bg-emerald-600 text-white hover:bg-emerald-700",
  },
  sluzby: {
    label: "Služby",
    headline: "Pomocná ruka od lidí z okolí",
    subline:
      "Hledáš řemeslníka, doučování nebo sekání trávy? Sousedé jsou blíž než agentury.",
    shellClass: "bg-sky-50/40",
    heroClass: "bg-white/80 backdrop-blur-md",
    heroBorderClass: "border-sky-200/60",
    accentClass: "text-sky-800",
    tabActiveClass:
      "bg-sky-600 text-white border-sky-600 shadow-sm shadow-sky-600/10",
    tabInactiveClass:
      "bg-white text-sky-700/80 border-sky-200/50 hover:border-sky-300 hover:text-sky-900",
    ctaClass: "bg-sky-600 text-white hover:bg-sky-700",
  },
  prace: {
    label: "Práce a brigády",
    headline: "Lokální úkoly a přivýdělky",
    subline:
      "Jednorázové projekty, záskoky i dlouhodobá výpomoc v docházkové vzdálenosti.",
    shellClass: "bg-indigo-50/40",
    heroClass: "bg-white/80 backdrop-blur-md",
    heroBorderClass: "border-indigo-200/60",
    accentClass: "text-indigo-800",
    tabActiveClass:
      "bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/10",
    tabInactiveClass:
      "bg-white text-indigo-700/80 border-indigo-200/50 hover:border-indigo-300 hover:text-indigo-900",
    ctaClass: "bg-indigo-600 text-white hover:bg-indigo-700",
  },
  nemovitost: {
    label: "Nemovitosti",
    headline: "Bydlení a prostory v okolí",
    subline:
      "Prodej i pronájem garáží, pokojů nebo bytů přímo od lidí, bez provize realitkám.",
    shellClass: "bg-cihla-50/70",
    heroClass: "bg-white/80 backdrop-blur-md",
    heroBorderClass: "border-cihla-900/20",
    accentClass: "text-cihla-950",
    tabActiveClass:
      "bg-cihla-900 text-white border-cihla-900 shadow-sm shadow-cihla-900/15",
    tabInactiveClass:
      "bg-white text-cihla-900/80 border-cihla-200/80 hover:border-cihla-300 hover:text-cihla-950",
    ctaClass: "bg-cihla-900 text-white hover:bg-cihla-950",
  },
  udalost: {
    label: "Události",
    headline: "Sousedské akce a dění v okolí",
    subline:
      "Garážové výprodeje, opékání špekáčků, sportovní zápasy nebo lokální trhy.",
    shellClass: "bg-rose-50/40",
    heroClass: "bg-white/80 backdrop-blur-md",
    heroBorderClass: "border-rose-200/60",
    accentClass: "text-rose-800",
    tabActiveClass:
      "bg-rose-600 text-white border-rose-600 shadow-sm shadow-rose-600/10",
    tabInactiveClass:
      "bg-white text-rose-700/80 border-rose-200/50 hover:border-rose-300 hover:text-rose-900",
    ctaClass: "bg-rose-600 text-white hover:bg-rose-700",
  },
};

export function parseHomeBrowseCategory(
  value: string | null | undefined,
): HomeBrowseCategory {
  if (!value) return "all";
  if (HOME_CATEGORY_ORDER.includes(value as HomeBrowseCategory)) {
    return value as HomeBrowseCategory;
  }
  return "all";
}
