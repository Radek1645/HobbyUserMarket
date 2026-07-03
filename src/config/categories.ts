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
  /** Label pole ve formuláři (výchozí: „Stav“) */
  conditionFieldLabel?: string;
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

const NEMOVITOST_CONDITIONS: CategoryConfig["conditionLabels"] = [
  { value: "sale", label: "Prodej" },
  { value: "rent", label: "Pronájem" },
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
  { value: "fixed", label: "Pevná cena (vstupné)" },
  { value: "offer", label: "Nabídni" },
];

const NEMOVITOST_PRICE_TYPES: CategoryConfig["priceTypes"] = [
  { value: "fixed", label: "Pevná cena" },
  { value: "negotiable", label: "Dohodou" },
  { value: "offer", label: "Nabídni" },
];

const PRACE_CONDITIONS: CategoryConfig["conditionLabels"] = [
  { value: "one_time", label: "Jednorázový úkol / brigáda" },
  { value: "long_term", label: "Dlouhodobá práce" },
  { value: "substitute", label: "Záskok" },
];

const PRACE_PRICE_TYPES: CategoryConfig["priceTypes"] = [
  { value: "fixed", label: "Hodinová / fixní mzda (Kč)" },
  { value: "negotiable", label: "Dohodou" },
  { value: "offer", label: "Nabídněte odměnu" },
];

export const CATEGORIES: CategoryConfig[] = [
  {
    type: "zbozi",
    label: "Zboží",
    subcategories: [
      { slug: "potraviny-domaci", label: "Potraviny a domácí výrobky" },
      { slug: "kola-sport", label: "Kola a sport" },
      { slug: "nabytek-domacnost", label: "Nábytek a domácnost" },
      {
        slug: "elektronika",
        label: "Elektronika",
        aiPrompt:
          "Úvod + Parametry (model, stav, výbava, baterie u mobilů…). Dotazník jen pokud chybí klíčové parametry.",
      },
      {
        slug: "auta-moto",
        label: "Auta a moto",
        aiPrompt:
          "Úvod + Parametry (rok, nájezd, motorizace, STK, výbava, stav). Na cenu se neptej, pokud je ve formuláři — cenu dej do úvodu. Dotazník jen na chybějící údaje.",
      },
      {
        slug: "moda-obleceni",
        label: "Móda a oblečení",
        aiPrompt:
          "Uživatel prodává módu. Pokud z textu či fotek NENÍ jasná VELIKOST nebo ZNAČKA, vygeneruj maximálně 2 stručné, lidské otázky (např. „Jaká je to velikost?“). Na volitelné parametry (materiál, sezóna) se ptej, jen pokud text neobsahuje téměř nic.",
      },
      { slug: "ostatni", label: "Ostatní" },
    ],
    conditionLabels: ZBOZI_CONDITIONS,
    priceTypes: COMMON_PRICE_TYPES,
    aiPrompt:
      "Analyzuj nabízené zboží. cleanedDescription: úvod (co prodáváš + cena v textu) a sekce Parametry s odrážkami (nájezd, rozměry, materiál, výbava, stav…). Ve formuláři dostaneš stav — u „Poškozené / na díly“ bez rozsahu vady se ptej. Doplňující otázky jen na chybějící zásadní parametry. Na cenu se neptej, pokud je ve formuláři.",
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
      "Uživatel nabízí službu. Pokud v textu chybí lokalita/dojezd (kde službu poskytuje) nebo informace o materiálu (zda je v ceně), zeptej se na to jednou či dvěma přátelskými otázkami. Pokud je text dostatečně jasný, neptej se na nic.",
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
    conditionFieldLabel: "Opakování",
    priceTypes: UDALOST_PRICE_TYPES,
    aiPrompt:
      "Analyzuj akci. Ve formuláři může být datum konání — na to se znovu neptej. Kritické parametry jsou: DATUM (pokud chybí ve formuláři i v textu), ČAS a LOKALITA. Pokud některý chybí, vygeneruj cílené otázky. U opakovaných akcí chtěj upřesnit frekvenci (např. „Které dny v týdnu akce platí?“).",
  },
  {
    type: "nemovitost",
    label: "Nemovitosti",
    subcategories: [
      { slug: "byty", label: "Byty" },
      { slug: "domy", label: "Domy" },
      { slug: "pozemky", label: "Pozemky" },
      { slug: "chata-chalupa", label: "Rekreační objekty" },
      { slug: "komercni", label: "Komerční objekty" },
      { slug: "ostatni", label: "Ostatní" },
    ],
    conditionLabels: NEMOVITOST_CONDITIONS,
    conditionFieldLabel: "Typ transakce",
    priceTypes: NEMOVITOST_PRICE_TYPES,
    aiPrompt:
      "Uživatel nabízí nemovitost. Skenuj text a fotky na: dispozice (např. 2+kk), plocha v m² a poplatky/kauce (u pronájmu). Pouze pokud tyto KRITICKÉ informace zcela chybí, vytvoř max 3 otázky. Na detaily typu patro, výtah nebo parkování se ptej, jen když je původní popis extrémně stručný.",
  },
  {
    type: "prace",
    label: "Práce a brigády",
    subcategories: [
      { slug: "brigady-jednorazove", label: "Brigády a jednorázové úkoly" },
      { slug: "retail-pohostinstvi", label: "Prodej a pohostinství" },
      { slug: "administrativa", label: "Administrativa a kancelář" },
      { slug: "it-digital", label: "IT a digitál" },
      { slug: "remeslo-stavba", label: "Řemeslo a stavba" },
      { slug: "pece-zahrada", label: "Péče, zahrada, domácnost" },
      { slug: "ostatni", label: "Ostatní" },
    ],
    conditionLabels: PRACE_CONDITIONS,
    conditionFieldLabel: "Typ úvazku",
    priceTypes: PRACE_PRICE_TYPES,
    aiPrompt:
      "Uživatel nabízí práci/brigádu. Zaměř se na: termín nástupu, požadavky na pracovníka a odměnu. Chybí-li tyto informace, zeptej se na ně. NEPOKOUŠEJ SE v tomto kroku upravovat nebo cenzurovat telefonní čísla a e-maily, to řeší systém jinde.",
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
 * Label pole stavu / typu transakce / opakování ve formuláři.
 */
export function getConditionFieldLabel(categoryType: string): string {
  const category = CATEGORIES.find((c) => c.type === categoryType);
  return category?.conditionFieldLabel ?? "Stav";
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
