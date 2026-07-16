import type { CategoryType, ConditionLabel, PriceType } from "@/types/post";

export type SubcategoryConfig = {
  slug: string;
  label: string;
  aiPrompt?: string;
  /** Nápověda v poli „Název inzerátu“ */
  titlePlaceholder?: string;
  /** Nápověda v poli „Popis“ */
  descriptionPlaceholder?: string;
  /** Info box ve formuláři — pravidla prodeje v dané podkategorii */
  listingNotice?: string;
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
  /** Výchozí nápověda názvu, pokud podkategorie nemá vlastní */
  titlePlaceholder?: string;
  /** Výchozí nápověda popisu, pokud podkategorie nemá vlastní */
  descriptionPlaceholder?: string;
  /** U pravidelných událostí (condition long_term) */
  titlePlaceholderRecurring?: string;
  descriptionPlaceholderRecurring?: string;
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
  { value: "fixed", label: "Hodinová mzda (Kč/h)" },
  { value: "negotiable", label: "Fixní odměna (Kč)" },
  { value: "offer", label: "Nabídněte odměnu" },
];

const SLUZBY_PRICE_TYPES: CategoryConfig["priceTypes"] = [
  { value: "fixed", label: "Hodinová sazba (Kč/h)" },
  { value: "negotiable", label: "Cena za zakázku (Kč)" },
  { value: "offer", label: "Dohodou" },
];

/** AI moderace — soukromá osoba vs. Podnikatel (VOP §7). */
const ADVERTISER_TYPE_AI_RULES =
  "Povinná pravidla — typ inzerenta (priorita před ostatními otázkami):\n" +
  "Zájemce musí vědět, zda inzerent jedná jako soukromá osoba, nebo v rámci podnikání (Podnikatel — firma, OSVČ apod.).\n" +
  "Logika: buď je jednoznačné v textu nebo na fotkách → zapiš do Parametrů konkrétní hodnotu (např. • Typ inzerenta: soukromá osoba nebo • Typ inzerenta: Podnikatel) a neptej se; nebo chybí / je nejasné → NEEDS_QUESTIONS (nikdy nehádej).\n" +
  "U NEEDS_QUESTIONS neuváděj v Parametrech řádek Typ inzerenta s placeholderem (…, -, prázdně) — chybějící typ ptej jen v dotazníku; odpověď se doplní automaticky.\n" +
  "Ptej se jen pokud z textu/fotek nevyplývá typ (paramLabel: „Typ inzerenta“; label např. „Inzerujete jako soukromá osoba, nebo v rámci podnikání (firma/OSVČ)?“).\n" +
  "Jednoznačné formulace (otázku neopakuj): „soukromě“, „osobně“, „jako majitel“, název firmy, „s.r.o.“, „v.o.s.“, „OSVČ“, „IČO“, „realitní kancelář“, „RK“.\n" +
  "Je-li Podnikatel, v Parametrech uveď firmu a IČO, pokud jsou v textu nebo na fotkách; chybí-li IČO u zjevného Podnikatele, ptej se (paramLabel: „IČO“; label např. „Jaké je vaše IČO?“).";

export const CATEGORIES: CategoryConfig[] = [
  {
    type: "zbozi",
    label: "Zboží",
    subcategories: [
      {
        slug: "potraviny-domaci",
        label: "Potraviny a domácí výrobky",
        titlePlaceholder: "např. Prodám med z vlastní včelny",
        descriptionPlaceholder:
          "Druh výrobku, množství, způsob předání, alergeny…",
        aiPrompt:
          "Uživatel nabízí potraviny nebo domácí jedlé výrobky.\n\n" +
          "Očekávej jedlé věci jako med, marmelády, sirupy, pečivo, ovoce, zeleninu, vejce, bylinky, koření, domácí zavařeniny nebo jiné potraviny a nápoje.\n" +
          "Pokud text nebo fotografie zjevně ukazují nejedlý produkt (např. elektroniku, router, WiFi extender, nábytek, oblečení, autodíl, nářadí), vrať REJECTED s důvodem, že inzerát je zařazený do špatné kategorie a má se přesunout jinam.\n" +
          "Pokud jde o potravinu, zeptej se jen na zásadní chybějící údaje jako druh, množství, forma balení, trvanlivost nebo alergeny, pokud jsou relevantní.",
      },
      {
        slug: "kola-sport",
        label: "Kola a sport",
        titlePlaceholder: "např. Dětské kolo Velo 20″",
        descriptionPlaceholder: "Značka, velikost, stav, příslušenství…",
      },
      {
        slug: "nabytek-domacnost",
        label: "Nábytek a domácnost",
        titlePlaceholder: "např. Jídelní stůl z masivu",
        descriptionPlaceholder: "Rozměry, materiál, stav, možnost odvozu…",
      },
      {
        slug: "elektronika",
        label: "Elektronika",
        titlePlaceholder: "např. iPhone 13, 128 GB",
        descriptionPlaceholder: "Model, stav, výbava, baterie, příslušenství…",
        aiPrompt:
          "Úvod + Parametry (model, stav, výbava, baterie u mobilů…). Dotazník jen pokud chybí klíčové parametry.",
      },
      {
        slug: "auta-moto",
        label: "Auta a moto",
        titlePlaceholder: "např. Škoda Octavia 2.0 TDI",
        descriptionPlaceholder: "Rok, nájezd, motorizace, STK, výbava, stav…",
        aiPrompt:
          "Úvod + Parametry (rok, nájezd, motorizace, STK, výbava, stav). Na cenu se neptej, pokud je ve formuláři — cenu dej do úvodu. Dotazník jen na chybějící údaje.",
      },
      {
        slug: "moda-obleceni",
        label: "Móda a oblečení",
        titlePlaceholder: "např. Dívčí bunda Nike, vel. 128",
        descriptionPlaceholder: "Značka, velikost, stav, materiál…",
        aiPrompt:
          "Uživatel prodává módu a oblečení.\n\n" +
          "SPODNÍ A INTIMNÍ PRÁDLO — povinná pravidla:\n" +
          "- Fotografie musí ukazovat pouze věc (věšák, flat lay, detail materiálu), ne osobu v prádle, postel ani boudoir styl.\n" +
          "- V popisu nebo Parametrech musí být velikost; doporuč značku a stav.\n" +
          "- Zamítnout (REJECTED, sexual_services), pokud foto sexualizuje osobu nebo inzerát působí jako nabídka sexuální služby místo prodeje věci.\n" +
          "- Pro předání piš „osobní předání po domluvě“ nebo „vyzvednutí po domluvě“, NIKDY „osobní prohlídka“ (to platí jen u nemovitostí).\n\n" +
          "Obecně: pokud z textu či fotek NENÍ jasná VELIKOST nebo ZNAČKA, vygeneruj maximálně 2 stručné otázky. Na volitelné parametry (materiál, sezóna) se ptej jen pokud text neobsahuje téměř nic.",
      },
      {
        slug: "ostatni",
        label: "Ostatní",
        titlePlaceholder: "např. Nabízím zahradní sekačku",
        descriptionPlaceholder: "Co nabízíte, stav, rozměry, způsob předání…",
      },
    ],
    conditionLabels: ZBOZI_CONDITIONS,
    priceTypes: COMMON_PRICE_TYPES,
    titlePlaceholder: "např. Nabízím použité zboží",
    descriptionPlaceholder: "Popis zboží, stav, rozměry, způsob předání…",
    aiPrompt:
      "Analyzuj nabízené zboží. cleanedDescription: úvod (co prodáváš + cena v textu) a sekce Parametry s odrážkami (nájezd, rozměry, materiál, výbava, stav…). Ve formuláři dostaneš stav — u „Poškozené / na díly“ bez rozsahu vady se ptej. Doplňující otázky jen na chybějící zásadní parametry. Na cenu se neptej, pokud je ve formuláři.",
  },
  {
    type: "sluzby",
    label: "Služby",
    subcategories: [
      {
        slug: "remeslo-opravy",
        label: "Řemeslo a opravy",
        titlePlaceholder: "např. Opravy truhlářských prací",
        descriptionPlaceholder: "Rozsah prací, materiál v ceně, lokalita/dojezd…",
      },
      {
        slug: "stehovani-doprava",
        label: "Stěhování a doprava",
        titlePlaceholder: "např. Stěhování bytu v Brně",
        descriptionPlaceholder: "Co přesunete, patro, výtah, vzdálenost…",
      },
      {
        slug: "pece-zahrada",
        label: "Péče, zahrada, domácnost",
        titlePlaceholder: "např. Úklid bytu nebo sekání trávy",
        descriptionPlaceholder:
          "Rozsah úklidu nebo práce, frekvence, materiál v ceně, lokalita/dojezd…",
        aiPrompt:
          "Uživatel nabízí službu v domácnosti (úklid, hlídání, drobné práce), péči nebo zahradu. U úklidu doplň rozsah (byt, dům, kancelář), frekvenci a zda je materiál v ceně. U zahrady rozsah a dojezd.",
      },
      {
        slug: "ostatni",
        label: "Ostatní",
        titlePlaceholder: "např. Nabízím doučování matematiky",
        descriptionPlaceholder: "Co nabízíte, lokalita/dojezd, cena/materiál…",
      },
    ],
    conditionLabels: SLUZBY_CONDITIONS,
    priceTypes: SLUZBY_PRICE_TYPES,
    titlePlaceholder: "např. Nabízím službu v okolí",
    descriptionPlaceholder: "Co nabízíte, lokalita/dojezd, materiál v ceně…",
    aiPrompt:
      "Uživatel nabízí službu (ne prodává zboží). Cena ve formuláři je buď hodinová sazba (Kč/h), orientační cena za celou zakázku, nebo „Dohodou“ — respektuj typ z formuláře, neptej se znovu na cenu.\n\n" +
      "Pokud v textu chybí lokalita/dojezd (kde službu poskytuje) nebo informace o materiálu (zda je v ceně), zeptej se na to jednou či dvěma přátelskými otázkami. Pokud je text dostatečně jasný, neptej se na nic.\n\n" +
      ADVERTISER_TYPE_AI_RULES,
  },
  {
    type: "udalost",
    label: "Událost",
    subcategories: [
      {
        slug: "koncert",
        label: "Koncert",
        titlePlaceholder: "např. Koncert na zahradě u Sokolovny",
        descriptionPlaceholder: "Datum, čas, místo, vstupné, kapacita…",
      },
      {
        slug: "narozeniny",
        label: "Narozeniny",
        titlePlaceholder: "např. Narozeninová oslava pro děti",
        descriptionPlaceholder: "Datum, čas, místo, program, kapacita…",
      },
      {
        slug: "opekani",
        label: "Opékání/grilování",
        titlePlaceholder: "např. Opékání na zahradě",
        descriptionPlaceholder: "Kapacita, co s sebou, jak se přihlásit…",
      },
      {
        slug: "sport",
        label: "Sport",
        titlePlaceholder: "např. Fotbalový turnaj na hřišti",
        descriptionPlaceholder: "Datum, čas, místo, pravidla, přihlášky…",
      },
      {
        slug: "workshop",
        label: "Workshop",
        titlePlaceholder: "např. Workshop výroby svíček",
        descriptionPlaceholder: "Datum, čas, místo, co s sebou, kapacita…",
      },
      {
        slug: "setkani",
        label: "Setkání / komunitní akce",
        titlePlaceholder: "např. Sousedské setkání u grilu",
        descriptionPlaceholder: "Datum, čas, místo, kapacita, co s sebou…",
      },
      {
        slug: "ostatni",
        label: "Ostatní",
        titlePlaceholder: "např. Komunitní akce v sousedství",
        descriptionPlaceholder: "Datum, čas, místo, kapacita, jak se přihlásit…",
      },
    ],
    conditionLabels: UDALOST_CONDITIONS,
    conditionFieldLabel: "Opakování",
    priceTypes: UDALOST_PRICE_TYPES,
    titlePlaceholder: "např. Opékání na zahradě",
    descriptionPlaceholder: "Kapacita, co s sebou, jak se přihlásit…",
    titlePlaceholderRecurring: "např. Čtvrteční poker u Honzy",
    descriptionPlaceholderRecurring:
      "Frekvence (každý čtvrtek 18:00…), kapacita, co s sebou, jak se přihlásit…",
    aiPrompt:
      "Analyzuj akci. Ve formuláři může být datum konání — na to se znovu neptej. Kritické parametry jsou: DATUM (pokud chybí ve formuláři i v textu), ČAS a LOKALITA. Pokud některý chybí, vygeneruj cílené otázky. U opakovaných akcí chtěj upřesnit frekvenci (např. „Které dny v týdnu akce platí?“).",
  },
  {
    type: "nemovitost",
    label: "Nemovitosti",
    subcategories: [
      {
        slug: "byty",
        label: "Byty",
        titlePlaceholder: "např. Pronájem bytu 2+kk v centru",
        descriptionPlaceholder: "Dispozice, plocha v m², patro, kauce, poplatky…",
      },
      {
        slug: "domy",
        label: "Domy",
        titlePlaceholder: "např. Prodej rodinného domu se zahradou",
        descriptionPlaceholder: "Dispozice, plocha, pozemek, stav, vybavení…",
      },
      {
        slug: "pozemky",
        label: "Pozemky",
        titlePlaceholder: "např. Stavební pozemek 800 m²",
        descriptionPlaceholder: "Plocha, územní plán, inženýrské sítě, přístup…",
      },
      {
        slug: "chata-chalupa",
        label: "Rekreační objekty",
        titlePlaceholder: "např. Prodej chaty u lesa",
        descriptionPlaceholder: "Dispozice, plocha, pozemek, sezónní využití…",
      },
      {
        slug: "komercni",
        label: "Komerční objekty",
        titlePlaceholder: "např. Pronájem skladových prostor",
        descriptionPlaceholder: "Plocha, využití, přístup, náklady navíc…",
      },
      {
        slug: "ostatni",
        label: "Ostatní",
        titlePlaceholder: "např. Nabízím nemovitost",
        descriptionPlaceholder: "Dispozice, plocha v m², stav, parkování…",
      },
    ],
    conditionLabels: NEMOVITOST_CONDITIONS,
    conditionFieldLabel: "Typ transakce",
    priceTypes: NEMOVITOST_PRICE_TYPES,
    titlePlaceholder: "např. Pronájem bytu 2+kk v centru",
    descriptionPlaceholder:
      "Dispozice, plocha v m², patro, kauce, poplatky, stav objektu, parkování…",
    aiPrompt:
      "Uživatel nabízí nemovitost — typ transakce (Prodej / Pronájem) a podkategorie (byt, dům, pozemek…) jsou ve formuláři. Skenuj text a všechny fotky.\n\n" +
      "Povinná pravidla — zadavatel a provize RK (priorita před ostatními otázkami):\n" +
      "Kupující/nájemce musí vždy vědět, zda inzeruje majitel (soukromá osoba), nebo realitní kancelář, a jak je to s provizí RK.\n" +
      "Logika: buď je vše jednoznačné v textu nebo na fotkách → zapiš do Parametrů (• Zadavatel: …, • Provize RK: …) a neptej se; nebo něco chybí / je nejasné → NEEDS_QUESTIONS (nikdy nehádej).\n\n" +
      "1) Zadavatel — ptej se jen pokud z textu/fotek nevyplývá, zda jde o majitele (soukromá inzerce), nebo realitní kancelář. (paramLabel: „Zadavatel“; label např. „Inzerujete jako majitel, nebo za realitní kancelář?“)\n" +
      "2) Provize RK — ptej se vždy, když: (a) je v textu zmíněna realitka / RK / makléř, ale není jasné, zda je provize v ceně, nebo navíc (hradí ji kupující/nájemce); (b) není jasné, zda jde o soukromou inzerci, nebo přes RK; (c) RK je potvrzená, ale chybí info o provizi. (paramLabel: „Provize RK“; label např. „Je provize realitní kanceláře zahrnutá v uvedené ceně, nebo se platí navíc?“)\n" +
      "U jednoznačné soukromé inzerce bez RK zapiš do Parametrů „Provize RK: bez provize“ — na provizi se neptej.\n" +
      "Jednoznačné formulace v textu (otázku neopakuj): „soukromý prodej“, „prodám vlastní“, „bez RK“, „realitka“, „RK“, „včetně provize“, „provize v ceně“, „provize navíc“, „provizi hradí kupující“, „provizi hradí nájemce“.\n\n" +
      "Další kritické údaje dle kontextu: dispozice (např. 2+kk), plocha v m²; u pronájmu též kauce a měsíční poplatky — ptej jen pokud zcela chybí. Na detaily (patro, výtah, parkování) se ptej jen při velmi stručném popisu. Celkem max 5 otázek.",
  },
  {
    type: "prace",
    label: "Práce a brigády",
    subcategories: [
      {
        slug: "brigady-jednorazove",
        label: "Brigády a jednorázové úkoly",
        titlePlaceholder: "např. Brigáda v kavárně o víkendu",
        descriptionPlaceholder: "Rozsah práce, termín, počet hodin, požadavky…",
      },
      {
        slug: "retail-pohostinstvi",
        label: "Prodej a pohostinství",
        titlePlaceholder: "např. Brigáda v kavárně o víkendu",
        descriptionPlaceholder: "Rozsah práce, směny, požadavky, termín nástupu…",
      },
      {
        slug: "administrativa",
        label: "Administrativa a kancelář",
        titlePlaceholder: "např. Administrativní podpora na DPP",
        descriptionPlaceholder: "Náplň práce, úvazek, požadavky, termín nástupu…",
      },
      {
        slug: "it-digital",
        label: "IT a digitál",
        titlePlaceholder: "např. Junior frontend developer na DPP",
        descriptionPlaceholder: "Náplň práce, technologie, úvazek, požadavky…",
      },
      {
        slug: "remeslo-stavba",
        label: "Řemeslo a stavba",
        titlePlaceholder: "např. Pomocník na stavbě — brigáda",
        descriptionPlaceholder: "Rozsah práce, lokalita, požadavky, termín…",
      },
      {
        slug: "pece-zahrada",
        label: "Péče, zahrada, domácnost",
        titlePlaceholder: "např. Pomoc se zahradou na víkend",
        descriptionPlaceholder: "Rozsah práce, termín, požadavky, odměna…",
      },
      {
        slug: "ostatni",
        label: "Ostatní",
        titlePlaceholder: "např. Nabízím práci v okolí",
        descriptionPlaceholder: "Náplň práce, požadavky, termín nástupu, odměna…",
      },
    ],
    conditionLabels: PRACE_CONDITIONS,
    conditionFieldLabel: "Typ úvazku",
    priceTypes: PRACE_PRICE_TYPES,
    titlePlaceholder: "např. Brigáda v kavárně o víkendu",
    descriptionPlaceholder:
      "Rozsah práce, požadavky (věk, praxe), termín nástupu, počet hodin…",
    aiPrompt:
      "Uživatel nabízí práci/brigádu. Zaměř se na: termín nástupu, požadavky na pracovníka a odměnu. Chybí-li tyto informace, zeptej se na ně. NEPOKOUŠEJ SE v tomto kroku upravovat nebo cenzurovat telefonní čísla a e-maily, to řeší systém jinde.\n\n" +
      ADVERTISER_TYPE_AI_RULES,
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

const DEFAULT_TITLE_PLACEHOLDER = "např. Název vašeho inzerátu";
const DEFAULT_DESCRIPTION_PLACEHOLDER = "Popis inzerátu…";

export type ListingPlaceholderOptions = {
  isRecurringEvent?: boolean;
};

function resolveListingPlaceholder(
  categoryType: string,
  subcategorySlug: string,
  field: "titlePlaceholder" | "descriptionPlaceholder",
  recurringField: "titlePlaceholderRecurring" | "descriptionPlaceholderRecurring",
  defaultValue: string,
  options?: ListingPlaceholderOptions,
): string {
  const category = CATEGORIES.find((c) => c.type === categoryType);
  if (!category) return defaultValue;

  if (options?.isRecurringEvent && category[recurringField]) {
    return category[recurringField]!;
  }

  const sub = category.subcategories.find((s) => s.slug === subcategorySlug);
  return sub?.[field] ?? category[field] ?? defaultValue;
}

export function getListingCategoryNotice(
  categoryType: string,
  subcategorySlug: string,
): string | undefined {
  const category = CATEGORIES.find((c) => c.type === categoryType);
  const sub = category?.subcategories.find((s) => s.slug === subcategorySlug);
  return sub?.listingNotice;
}

/** Nápověda v poli „Název inzerátu“ podle kategorie a podkategorie. */
export function getListingTitlePlaceholder(
  categoryType: string,
  subcategorySlug: string,
  options?: ListingPlaceholderOptions,
): string {
  return resolveListingPlaceholder(
    categoryType,
    subcategorySlug,
    "titlePlaceholder",
    "titlePlaceholderRecurring",
    DEFAULT_TITLE_PLACEHOLDER,
    options,
  );
}

/** Nápověda v poli „Popis“ podle kategorie a podkategorie. */
export function getListingDescriptionPlaceholder(
  categoryType: string,
  subcategorySlug: string,
  options?: ListingPlaceholderOptions,
): string {
  return resolveListingPlaceholder(
    categoryType,
    subcategorySlug,
    "descriptionPlaceholder",
    "descriptionPlaceholderRecurring",
    DEFAULT_DESCRIPTION_PLACEHOLDER,
    options,
  );
}
