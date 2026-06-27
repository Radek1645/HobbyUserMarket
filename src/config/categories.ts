import type { CategoryType, ConditionLabel, PriceType } from "@/types/post";

export type SubcategoryConfig = {
  slug: string;
  label: string;
  aiPrompt?: string;
};

export type CategoryConfig = {
  type: CategoryType;
  label: string;
  subcategories: SubcategoryConfig[];
  conditionLabels: { value: ConditionLabel; label: string }[];
  priceTypes: { value: PriceType; label: string }[];
  aiPrompt?: string;
};

const ZBOZI_CONDITIONS: CategoryConfig["conditionLabels"] = [
  { value: "new", label: "Nové" },
  { value: "like_new", label: "Jako nové" },
  { value: "used", label: "Použité" },
  { value: "damaged", label: "Poškozené / na díly" },
];

const SLUZBY_CONDITIONS: CategoryConfig["conditionLabels"] = [
  { value: "one_time", label: "Jednorázově" },
  { value: "long_term", label: "Dlouhodobě" },
  { value: "substitute", label: "Záskok" },
];

const UDALOST_CONDITIONS: CategoryConfig["conditionLabels"] = [
  { value: "one_time", label: "Jednorázová akce" },
  { value: "long_term", label: "Pravidelná akce" },
];

const COMMON_PRICE_TYPES: CategoryConfig["priceTypes"] = [
  { value: "fixed", label: "Pevná cena" },
  { value: "free_pickup", label: "Za odvoz / zdarma" },
  { value: "negotiable", label: "Dohodou" },
  { value: "exchange", label: "Výměnou" },
  { value: "offer", label: "Nabídni" },
];

const UDALOST_PRICE_TYPES: CategoryConfig["priceTypes"] = [
  { value: "free_pickup", label: "Vstup zdarma" },
  { value: "offer", label: "Nabídni" },
];

export const CATEGORIES: CategoryConfig[] = [
  {
    type: "zbozi",
    label: "Zboží",
    subcategories: [
      { slug: "potraviny-domaci", label: "Potraviny a domácí výrobky" },
      { slug: "kola-sport", label: "Kola a sport" },
      { slug: "nabytek-domacnost", label: "Nábytek a domácnost" },
      { slug: "elektronika", label: "Elektronika" },
      { slug: "auta-moto", label: "Auta a moto" },
      { slug: "ostatni", label: "Ostatní" },
    ],
    conditionLabels: ZBOZI_CONDITIONS,
    priceTypes: COMMON_PRICE_TYPES,
    aiPrompt:
      "Uživatel prodává zboží. Hledej vady, barvu, model, rok výroby. U stavu poškozené/na díly: rozsah poškození, vhodnost k opravě nebo rozebrání. Chybějící data → doplňující otázky.",
  },
  {
    type: "sluzby",
    label: "Služby",
    subcategories: [
      { slug: "remeslo-opravy", label: "Řemeslo a opravy" },
      { slug: "stehovani-doprava", label: "Stěhování a doprava" },
      { slug: "pece-zahrada", label: "Péče a zahrada" },
      { slug: "ostatni", label: "Ostatní" },
    ],
    conditionLabels: SLUZBY_CONDITIONS,
    priceTypes: COMMON_PRICE_TYPES,
    aiPrompt:
      "Uživatel nabízí službu. Generuj 1–3 otázky: dojezd, materiál v ceně, rozsah práce.",
  },
  {
    type: "udalost",
    label: "Událost",
    subcategories: [
      { slug: "koncert", label: "Koncert" },
      { slug: "narozeniny", label: "Narozeniny" },
      { slug: "opekani", label: "Opékání" },
      { slug: "sport", label: "Sport" },
      { slug: "workshop", label: "Workshop" },
      { slug: "setkani", label: "Setkání / komunitní akce" },
      { slug: "ostatni", label: "Ostatní" },
    ],
    conditionLabels: UDALOST_CONDITIONS,
    priceTypes: UDALOST_PRICE_TYPES,
    aiPrompt:
      "Uživatel nabízí událost. Rozliš jednorázovou vs. pravidelnou akci. U pravidelných akcí extrahuj frekvenci (např. každý čtvrtek). Vždy: datum nejbližšího konání, čas, lokalita, kapacita, instrukce k přihlášení.",
  },
];

export function getCategoryConfig(type: CategoryType): CategoryConfig {
  const found = CATEGORIES.find((c) => c.type === type);
  if (!found) {
    throw new Error(`Neznámá kategorie: ${type}`);
  }
  return found;
}

export function isValidSubcategory(
  type: CategoryType,
  subcategorySlug: string,
): boolean {
  return getCategoryConfig(type).subcategories.some(
    (s) => s.slug === subcategorySlug,
  );
}

/** Slug → čitelný text: `remeslo-opravy` → „Remeslo opravy“ */
export function formatSlugAsLabel(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Název hlavní kategorie pro zobrazení.
 * Neznámý `category_type` z DB (stará data) → fallback z textu slugu.
 */
export function getCategoryLabel(categoryType: string): string {
  const found = CATEGORIES.find((c) => c.type === categoryType);
  return found?.label ?? formatSlugAsLabel(categoryType);
}

export type SubcategoryDisplay = {
  label: string;
  /** true = slug už není v categories.ts (smazaná/přejmenovaná podkategorie) */
  isLegacy: boolean;
};

/**
 * Název podkategorie pro zobrazení inzerátu.
 * Slug v DB je vždy autoritativní identita; label bereme z configu, jinak fallback.
 */
export function getSubcategoryLabel(
  categoryType: string,
  subcategorySlug: string,
): SubcategoryDisplay {
  const category = CATEGORIES.find((c) => c.type === categoryType);
  const sub = category?.subcategories.find((s) => s.slug === subcategorySlug);

  if (sub) {
    return { label: sub.label, isLegacy: false };
  }

  return { label: formatSlugAsLabel(subcategorySlug), isLegacy: true };
}

/**
 * Štítek stavu / typu akce podle kategorie (stejný DB slug, jiný label v UI).
 */
export function getConditionLabel(
  categoryType: string,
  conditionLabel: string,
): string {
  const category = CATEGORIES.find((c) => c.type === categoryType);
  const found = category?.conditionLabels.find((c) => c.value === conditionLabel);
  if (found) return found.label;
  return formatSlugAsLabel(conditionLabel);
}

/**
 * Štítek typu ceny podle kategorie (stejný DB slug, jiný label v UI).
 * Např. u události: free_pickup → „Vstup zdarma“, u zboží → „Za odvoz / zdarma“.
 */
export function getPriceTypeLabel(
  categoryType: string,
  priceType: string,
): string {
  const category = CATEGORIES.find((c) => c.type === categoryType);
  const found = category?.priceTypes.find((p) => p.value === priceType);
  if (found) return found.label;
  return formatSlugAsLabel(priceType);
}
