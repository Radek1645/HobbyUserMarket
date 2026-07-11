/**
 * Seznam zakázaného obsahu — hlavní soubor k úpravám.
 * Při zapnutí AI moderace zkopíruj i do supabase/functions/_shared/ (deploy Edge Function).
 */

export type ProhibitedTopic = {
  /** Stabilní ID — nepřejmenovávej po nasazení (logy, AI odpovědi). */
  id: string;
  /** Krátký název (UI, logy). */
  label: string;
  /** Co přesně AI / moderace má zamítnout — piš konkrétně. */
  criteria: string;
  /** Volitelně: budoucí rychlý lokální filtr před voláním AI. */
  keywords?: readonly string[];
};

export const PROHIBITED_TOPICS: readonly ProhibitedTopic[] = [
  {
    id: "illegal_drugs",
    label: "Drogy a omamné látky",
    criteria:
      "Prodej, nákup, výměna nebo propagace nelegálních drog, prekurzorů, semen konopí k pěstování (kde to není legální), psychedelik mimo legální rámec, „matka“ na výrobu drog.",
    keywords: ["marihuana", "weed", "kokain", "pervitin", "ecstasy", "lsd"],
  },
  {
    id: "weapons",
    label: "Zbraně a munice",
    criteria:
      "Prodej nebo nabídka střelných zbraní, střeliva, výbušnin, granátů, nožů určených primárně jako útočné zbraně (např. switchblade), zbraní bez legálního rámce.",
    keywords: ["gun", "pistole", "kulomet", "munice", "granát"],
  },
  {
    id: "sexual_services",
    label: "Sexuální služby a pornografie",
    criteria:
      "Nabídka nebo poptávka sexuálních služeb, erotických masáží s explicitním sexuálním kontextem, pornografického obsahu, eskort služeb, „privátů“. " +
      "Také inzeráty u zboží nebo módy, které primárně sexualizují osobu na fotografii (model v negližé na posteli, boudoir póza) místo produktu — zejména u vágního textu typu „spodní prádlo“ bez velikosti, značky a produktové fotografie (typický vzor escort návnady). " +
      "U módy platí: spodní a intimní prádlo jen s fotkou věci a uvedenou velikostí; jinak REJECTED.",
    keywords: ["escort", "erotika", "sex ", "porno", "privát"],
  },
  {
    id: "human_organs",
    label: "Lidské orgány a tkáně",
    criteria: "Prodej nebo nabídka lidských orgánů, krve mimo legální dárcovství, tkání.",
  },
  {
    id: "stolen_goods",
    label: "Kradené věci",
    criteria:
      "Vědomá nabídka kradeného zboží, vybavení bez dokladu o původu, IMEI/serial „neznámý“, formulace naznačující nelegální původ.",
    keywords: ["kradene", "ukrad", "cinkl"],
  },
  {
    id: "counterfeit",
    label: "Padělky a nelegální repliky",
    criteria:
      "Padělky značkového zboží prezentované jako originál, nelegální kopie s cílem klamat kupujícího.",
    keywords: ["replika 1:1", "fake", "padělek"],
  },
  {
    id: "hate_violence",
    label: "Nenávist a násilí",
    criteria:
      "Obsah podněcující k násilí, terorismu, nenávisti vůči skupině lidí, oslavující trestné činy.",
  },
  {
    id: "scam_fraud",
    label: "Podvod a phishing",
    criteria:
      "Pyramidové schémata, podvodné nabídky, phishing, falešné investice, požadavek platby předem bez reálného zboží.",
    keywords: ["investice garant", "rychle zbohat", "western union"],
  },
  {
    id: "animals_illegal",
    label: "Nelegální obchod se zvířaty",
    criteria:
      "Prodej ohrožených druhů, zvířat bez povolení, psů z množíren v rozporu s místními pravidly platformy.",
  },
  {
    id: "medical_prescription",
    label: "Léky na předpis",
    criteria:
      "Prodej léčiv na předpis bez oprávnění, anabolik, nelegální doplnění s tvrzením o léčebném účinku.",
  },
  {
    id: "tobacco_alcohol_minors",
    label: "Alkohol a tabák pro nezletilé",
    criteria:
      "Nabídka explicitně cílená na nezletilé, prodej alkoholu/tabáku tam, kde je to zakázáno.",
  },
  {
    id: "minor_photos",
    label: "Fotografie dětí a adolescentů",
    criteria:
      "Fotografie, na které je rozpoznatelně zachycen člověk vypadající jako malé dítě nebo adolescent (odhad mladší 18 let), ať už jako hlavní motiv nebo výrazná část snímku — včetně skupinových fotek. Zamítni i snímky, kde je taková osoba na pozadí nebo v odrazu. Výjimka: fotka ukazuje pouze věc bez rozpoznatelné tváře nezletilé osoby (např. dětské kolo, hračka). Samotný text typu „dětské kolo“ bez dítěte na fotografii není důvod k zamítnutí.",
  },
  {
    id: "gambling_illegal",
    label: "Nelegální hazard",
    criteria:
      "Organizace hazardních her bez licence, sázení mimo legální rámec.",
  },
] as const;

export type ProhibitedTopicId = (typeof PROHIBITED_TOPICS)[number]["id"];

export function getProhibitedTopic(id: string): ProhibitedTopic | undefined {
  return PROHIBITED_TOPICS.find((topic) => topic.id === id);
}

/** Shrnutí pro UI (patka dialogu, nápověda). */
export function getProhibitedTopicsSummaryLabels(): string[] {
  return PROHIBITED_TOPICS.map((topic) => topic.label);
}
