type CategoryTipExamples = Readonly<Record<string, string>> & {
  readonly default: string;
};

/** Krátké příklady v tipu u nahrávání fotek — podle kategorie a podkategorie. */
const LISTING_FORM_TIP_EXAMPLES: Readonly<
  Record<string, CategoryTipExamples>
> = {
  zbozi: {
    default: "Prodám použité zboží",
    "potraviny-domaci": "Prodám med z vlastní včelny",
    "kola-sport": "Prodám dětské kolo",
    "nabytek-domacnost": "Prodám jídelní stůl z masivu",
    elektronika: "Prodám funkční mobil",
    "auta-moto": "Prodám použité auto",
    "moda-obleceni": "Prodám dívčí bundu ve vel. 128",
    ostatni: "Prodám zahradní sekačku",
  },
  sluzby: {
    default: "Nabízím službu v okolí",
    "remeslo-opravy": "Opravím nábytek na míru",
    "stehovani-doprava": "Nabízím stěhování bytu",
    "pece-zahrada": "Nabízím úklid bytu",
    ostatni: "Nabízím doučování matematiky",
  },
  udalost: {
    default: "Pořádáme akci v okolí",
    koncert: "Pořádáme koncert na zahradě",
    narozeniny: "Pořádáme narozeninovou oslavu",
    opekani: "Pořádáme opékání na zahradě",
    sport: "Pořádáme fotbalový turnaj",
    workshop: "Pořádáme workshop výroby svíček",
    setkani: "Pořádáme sousedské setkání",
    ostatni: "Pořádáme komunitní akci",
  },
  nemovitost: {
    default: "Nabízím nemovitost v okolí",
    byty: "Nabízím pronájem bytu 2+kk",
    domy: "Prodám rodinný dům se zahradou",
    pozemky: "Prodám stavební pozemek",
    "chata-chalupa": "Prodám chatu u lesa",
    komercni: "Nabízím pronájem skladu",
    ostatni: "Nabízím nemovitost",
  },
  prace: {
    default: "Hledám brigádu v okolí",
    "brigady-jednorazove": "Hledám brigádu na víkend",
    "retail-pohostinstvi": "Hledám brigádu v kavárně",
    administrativa: "Hledám administrativní podporu",
    "it-digital": "Hledám junior developera",
    "remeslo-stavba": "Hledám pomocníka na stavbě",
    "pece-zahrada": "Hledám pomoc se zahradou",
    ostatni: "Hledám práci v okolí",
  },
};

const FALLBACK_LISTING_FORM_TIP_EXAMPLE = "Nabízím inzerát v okolí";

/** Příklad ve větě tipu u fotek podle kategorie a podkategorie. */
export function getListingFormTipExample(
  categoryType: string,
  subcategorySlug: string,
): string {
  const categoryExamples = LISTING_FORM_TIP_EXAMPLES[categoryType];
  if (!categoryExamples) {
    return FALLBACK_LISTING_FORM_TIP_EXAMPLE;
  }

  return categoryExamples[subcategorySlug] ?? categoryExamples.default;
}
