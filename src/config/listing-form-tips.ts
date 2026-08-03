type CategoryTipExamples = Readonly<Record<string, string>> & {
  readonly default: string;
};

/** Krátké příklady v tipu u nahrávání fotek — podle kategorie a podkategorie. */
const LISTING_FORM_TIP_EXAMPLES: Readonly<
  Record<string, CategoryTipExamples>
> = {
  auto: {
    default: "Prodám použité auto",
    "osobni-auta": "Prodám Škodu Octavia",
    motorky: "Prodám motorku",
    "dily-prislusenstvi": "Prodám autodíly",
    ostatni: "Prodám střešní box",
  },
  detsky: {
    default: "Prodám dětské věci",
    "detske-obleceni-obuv": "Prodám dívčí bundu ve vel. 128",
    "kocarky-sedacky-nabytek": "Prodám kočárek",
    "hracky-miminka": "Prodám hračky pro miminko",
    ostatni: "Prodám dětskou postýlku",
  },
  dum: {
    default: "Prodám věci do domácnosti",
    "nabytek-doplnky": "Prodám jídelní stůl z masivu",
    "zahrada-naradi": "Prodám zahradní sekačku",
    "potraviny-domaci": "Prodám med z vlastní včelny",
    ostatni: "Prodám zahradní nábytek",
  },
  elektro: {
    default: "Prodám funkční elektroniku",
    mobily: "Prodám funkční mobil",
    pc: "Prodám notebook",
    "tv-foto-audio": "Prodám televizi",
    spotrebice: "Prodám pračku",
    ostatni: "Prodám nabíječku",
  },
  moda: {
    default: "Prodám oblečení",
    "damske-panske": "Prodám bundu ve vel. M",
    "boty-doplnky": "Prodám tenisky",
    ostatni: "Prodám kabelku",
  },
  sport: {
    default: "Prodám sportovní výbavu",
    "kola-kolobezky": "Prodám horské kolo",
    "zimni-sport": "Prodám lyže",
    ostatni: "Prodám posilovací lavici",
  },
  hobby: {
    default: "Prodám hobby věc",
    "knihy-hry-hudba": "Prodám deskovou hru",
    "sberatelstvi-umeni": "Prodám sběratelský kousek",
    ostatni: "Prodám modelářskou stavebnici",
  },
  ostatni: {
    default: "Prodám věc k odvozu",
    ostatni: "Prodám věc k odvozu",
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
