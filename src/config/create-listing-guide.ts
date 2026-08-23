import { SITE_DISPLAY_NAME, SITE_SHORT_NAME } from "@/config/site";

/** SEO stránka — jak jednoduše založit inzerát (odkaz z patičky). */
export const CREATE_LISTING_GUIDE_PATH = "/jak-vytvorit-inzerat";

export type CreateListingGuideDemoId = "router" | "bike" | "appliance";

export type CreateListingGuideDemo = {
  id: CreateListingGuideDemoId;
  /** Krátký label záložky. */
  tabLabel: string;
  /** Jedna věta pod záložkami — co scénář ukazuje. */
  hint: string;
  /** Cesta k fotce v public/, nebo null = barevný placeholder. */
  imageSrc: string | null;
  /** Volitelná fotka štítku (2. miniatura ve kroku 1). */
  labelImageSrc: string | null;
  /** Tailwind pozadí placeholderu, když chybí fotka. */
  imagePlaceholderClass: string;
  imageAlt: string;
  /** Název po AI předvyplnění (krok 2). */
  draftTitle: string;
  /** Popis po AI předvyplnění — včetně řádků „Doplňte …:“. */
  draftDescription: string;
  categoryLabel: string;
  priceLabel: string;
  locationLabel: string;
  aiTitle: string;
  aiDescriptionIntro: string;
  aiQuestion: string;
  aiQuestionAnswer: string;
  parameters: readonly string[];
  publishedTitle: string;
  feedBadge: string;
};

export const CREATE_LISTING_GUIDE_DEMOS: readonly CreateListingGuideDemo[] = [
  {
    id: "router",
    tabLabel: "Elektronika",
    hint: "Vyfoťte i štítek s parametry — doplníme je do inzerátu.",
    imageSrc: "/images/guide/demo-router.png",
    labelImageSrc: "/images/guide/demo-router-stittek.png",
    imagePlaceholderClass: "bg-slate-200",
    imageAlt: "Ukázková fotka Wi‑Fi routeru se 4 anténami",
    draftTitle: "Wi‑Fi 6 router NL-AX3000 (4 antény)",
    draftDescription:
      "Nabízím černý Wi‑Fi 6 router se 4 anténami.\nDoplňte stáří: ",
    categoryLabel: "Elektronika · Ostatní",
    priceLabel: "890 Kč",
    locationLabel: "Brno — Královo Pole",
    aiTitle: "Wi‑Fi 6 router NL-AX3000 (4 antény)",
    aiDescriptionIntro:
      "Nabízím černý Wi‑Fi 6 router se 4 anténami v dobrém stavu. Parametry ze štítku na spodku zařízení. Osobní předání v Brně.",
    aiQuestion: "Jaký je stav a stáří zařízení?",
    aiQuestionAnswer: "2 roky, bez poškození",
    parameters: [
      "Model: NL-AX3000",
      "Wi‑Fi 6 (802.11ax), dual-band",
      "4× Gigabit LAN",
    ],
    publishedTitle: "Wi‑Fi 6 router NL-AX3000 (4 antény)",
    feedBadge: "Elektronika",
  },
  {
    id: "bike",
    tabLabel: "Kolo",
    hint: "Stačí 1–2 fotky — název a popis navrhneme.",
    imageSrc: "/images/guide/demo-kolo.jpg",
    labelImageSrc: null,
    imagePlaceholderClass: "bg-sky-100",
    imageAlt: "Ukázková fotka dětského kola",
    draftTitle: "Dětské kolo 20″",
    draftDescription:
      "Nabízím dětské kolo v dobrém stavu, velikost kol 20″.\nDoplňte značku: ",
    categoryLabel: "Sport · Kola a koloběžky",
    priceLabel: "1 500 Kč",
    locationLabel: "Brno — Královo Pole",
    aiTitle: "Prodám dětské kolo 20″",
    aiDescriptionIntro:
      "Nabízím dětské kolo v dobrém stavu, vhodné pro dítě cca 6–9 let. Cena 1 500 Kč, osobní předání v Brně.",
    aiQuestion: "Jaká je značka nebo typ rámu?",
    aiQuestionAnswer: "Author Energy",
    parameters: [
      "Velikost kol: 20″",
      "Stav: použité, funkční",
      "Barva: modrá",
    ],
    publishedTitle: "Prodám dětské kolo 20″",
    feedBadge: "Sport",
  },
  {
    id: "appliance",
    tabLabel: "Spotřebič",
    hint: "I text na zadním štítku převedeme do parametrů.",
    imageSrc: "/images/guide/demo-mikrovlnka.png",
    labelImageSrc: "/images/guide/demo-mikrovlnka-stittek.png",
    imagePlaceholderClass: "bg-amber-100",
    imageAlt: "Ukázková fotka bílé mikrovlnné trouby",
    draftTitle: "Bílá mikrovlnná trouba 23 l / 800 W",
    draftDescription:
      "Nabízím bílou mikrovlnnou troubu s digitálním displejem.\nDoplňte značku: ",
    categoryLabel: "Elektronika · Spotřebiče",
    priceLabel: "1 200 Kč",
    locationLabel: "Brno — Žabovřesky",
    aiTitle: "Bílá mikrovlnná trouba 23 l / 800 W",
    aiDescriptionIntro:
      "Nabízím bílou mikrovlnnou troubu s digitálním displejem a otočným ovladačem. Parametry ze štítku na zadní straně. Osobní předání v Brně.",
    aiQuestion: "Má gril nebo rozmrazování?",
    aiQuestionAnswer: "Ano, gril 1000 W",
    parameters: [
      "Objem: 23 l",
      "Mikrovlnný výkon: 800 W",
      "Gril: 1000 W",
    ],
    publishedTitle: "Bílá mikrovlnná trouba 23 l / 800 W",
    feedBadge: "Elektronika",
  },
] as const;

export const CREATE_LISTING_GUIDE_DEFAULT_DEMO_ID: CreateListingGuideDemoId =
  "router";

export function getCreateListingGuideDemo(
  id: CreateListingGuideDemoId,
): CreateListingGuideDemo {
  return (
    CREATE_LISTING_GUIDE_DEMOS.find((demo) => demo.id === id) ??
    CREATE_LISTING_GUIDE_DEMOS[0]
  );
}

export const CREATE_LISTING_GUIDE_UI = {
  footerLinkLabel: "Jak vytvořit inzerát",
  metaTitle: `Jak vytvořit inzerát za 2 minuty | ${SITE_DISPLAY_NAME}`,
  metaDescription: `Vyfoťte 1–2 fotky mobilem. ${SITE_SHORT_NAME} navrhne název, popis a kategorii. Doplníte cenu a lokalitu — účet až při publikaci.`,
  pageTitle: "Jak snadno lze vytvořit inzerát do dvou minut?",
  intro:
    "U zboží stačí 1–2 fotky. Navrhneme název, popis i kategorii. Cenu, stav a lokalitu doplníte vy. Služby, práci, reality a události vyplníte ručně.",
  scenariosLabel: "Ukázky podle typu věci",
  ctaLabel: "Vytvořit inzerát",
  ctaHint:
    "Na mobilu vyfoťte věc. Název a popis napíšeme. Účet založíte až když inzerát publikujete.",
  steps: [
    {
      number: 1,
      title: "Vyfoťte 1–2 fotky a nechte si inzerát předvyplnit",
      body: "Na mobilu zvolte Vyfotit nebo Vybrat z galerie. Po Předvyplnit inzerát navrhneme název, popis i kategorii. Služby, události, práci a reality založíte tlačítkem Vyplnit inzerát ručně.",
    },
    {
      number: 2,
      title: "Doplňte cenu, stav a lokalitu",
      body: "Text a kategorii už máte připravené — zatím jde o pracovní verzi. Zkontrolujte je, doplňte prázdné údaje (žlutě orámované) a klidně přidejte další fotky. Řádky „Doplňte …:“ vyplňte za dvojtečku, nebo je smažte. V dalším kroku to AI zpracuje do finální podoby.",
    },
    {
      number: 3,
      title: "Zkontrolujeme, že obsah sedí",
      body: "Po kliknutí na Publikovat ověříme, že text odpovídá fotkám a splňuje Podmínky inzerce. Když něco nesedí, řekneme vám to hned.",
    },
    {
      number: 4,
      title: "AI upraví text za vás",
      body: "Navrhneme srozumitelný popis, doplníme parametry z fotek a zeptáme se jen na to, co chybí. Návrh můžete upravit, nebo ponechat svůj původní text.",
    },
    {
      number: 5,
      title: "Inzerát je online",
      body: "Zobrazí se lidem v okolí. Telefon a e-mail zůstanou skryté, dokud se zájemce nepřihlásí. Poptávku můžete dostat i e-mailem.",
    },
  ],
  faq: [
    {
      question: "Musím nejdřív napsat popis?",
      answer:
        "Ne. U zboží stačí 1–2 fotky — název, popis a kategorii navrhneme. Původní text můžete kdykoli publikovat i bez úprav AI.",
    },
    {
      question: "Musím mít účet, než začnu?",
      answer:
        "Fotit a vyplňovat můžete hned. Účet (Google nebo e-mail) založíte až při publikaci. Zájemce uvidí váš kontakt až po svém přihlášení.",
    },
    {
      question: "Musím přepisovat údaje ze štítku?",
      answer:
        "Ne. Vyfoťte i štítek s parametry — často je doplníme sami. Před publikací si text vždy zkontrolujte; AI může udělat chybu.",
    },
    {
      question: "Co když inzeruji službu, práci nebo událost?",
      answer:
        "Zvolte Vyplnit inzerát ručně — vyberete kategorii a napíšete text klasicky. Předvyplnění z fotek je určené hlavně pro zboží.",
    },
    {
      question: "Kolik to stojí?",
      answer:
        "Založení účtu i inzerce jsou zdarma. Počet publikací je omezený — aktuální limity najdete v sekci Limity inzerce.",
    },
  ],
} as const;

/** @deprecated Použij CREATE_LISTING_GUIDE_DEMOS / getCreateListingGuideDemo. */
export const CREATE_LISTING_GUIDE_DEMO = getCreateListingGuideDemo("bike");

/** @deprecated */
export const CREATE_LISTING_GUIDE_DEMO_IMAGE = "/images/guide/demo-kolo.jpg";
