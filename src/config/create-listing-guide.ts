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
  draftTitle: string;
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
    hint: "Vyfoťte i štítek s parametry — AI je doplní do inzerátu.",
    imageSrc: "/images/guide/demo-router.png",
    labelImageSrc: "/images/guide/demo-router-stittek.png",
    imagePlaceholderClass: "bg-slate-200",
    imageAlt: "Ukázková fotka Wi‑Fi routeru se 4 anténami",
    draftTitle: "Prodám Wi‑Fi router",
    draftDescription: "Starý router, funguje",
    categoryLabel: "Zboží · Elektronika",
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
    hint: "Stačí fotka a krátký popis — AI doplní detaily z fotky.",
    imageSrc: "/images/guide/demo-kolo.jpg",
    labelImageSrc: null,
    imagePlaceholderClass: "bg-sky-100",
    imageAlt: "Ukázková fotka dětského kola",
    draftTitle: "Prodám kolo",
    draftDescription: "Prodám dětské kolo v dobrém stavu",
    categoryLabel: "Zboží · Sport a outdoor",
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
    feedBadge: "Sport a outdoor",
  },
  {
    id: "appliance",
    tabLabel: "Spotřebič",
    hint: "I text na zadním štítku AI umí převést do parametrů.",
    imageSrc: "/images/guide/demo-mikrovlnka.png",
    labelImageSrc: "/images/guide/demo-mikrovlnka-stittek.png",
    imagePlaceholderClass: "bg-amber-100",
    imageAlt: "Ukázková fotka bílé mikrovlnné trouby",
    draftTitle: "Prodám mikrovlnku",
    draftDescription: "Funguje, odvoz ihned",
    categoryLabel: "Zboží · Domácnost",
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
    feedBadge: "Domácnost",
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
  metaDescription: `Vyfoťte věc mobilem — klidně i štítek s parametry. AI na ${SITE_SHORT_NAME} doplní popis. Ukázka ve 4 krocích.`,
  pageTitle: "Jak snadno lze vytvořit inzerát do dvou minut?",
  scenariosLabel: "Ukázky podle typu věci",
  ctaLabel: "Vytvořit inzerát s AI",
  ctaHint: "Registrace zabere chvíli — pak rovnou fotíte a píšete.",
  steps: [
    {
      number: 1,
      title: "Vyfoťte nebo nahrajte fotku a napište krátký popisek",
      body: "Vyberete kategorii, vyfotíte věc nebo nahrajete fotku z galerie a napíšete pár slov. Nemusíte psát román — stačí krátký název. Klidně přidejte i fotku štítku s parametry.",
    },
    {
      number: 2,
      title: "Zkontrolujeme, že obsah sedí",
      body: "Po kliknutí na Publikovat ověříme, že text odpovídá fotkám a splňuje pravidla inzerce. Když něco nesedí, řekneme vám to hned.",
    },
    {
      number: 3,
      title: "AI upraví text za vás",
      body: "Projde-li kontrola, AI navrhne popis, přečte i text na fotkách (např. štítek) a doplní parametry. Zeptá se jen na to, co chybí. Návrh si můžete ještě upravit.",
    },
    {
      number: 4,
      title: "Inzerát je online",
      body: "Hotovo — inzerát se zobrazí ve vašem okolí s fotkou, cenou a přehledným popisem. Kontakt zůstane chráněný, dokud se někdo neozve.",
    },
  ],
  faq: [
    {
      question: "Musím mít dlouhý popis?",
      answer:
        "Ne. Stačí krátký popis — AI z fotek a kategorie doplní strukturovaný popis. Původní text můžete kdykoli publikovat i bez úprav.",
    },
    {
      question: "Musím přepisovat údaje ze štítku?",
      answer:
        "Ne. Vyfoťte i štítek s parametry — AI je často doplní sama. Před publikací si text vždy zkontrolujte; AI může udělat chybu.",
    },
    {
      question: "Funguje to i na počítači?",
      answer:
        "Ano. Formulář je stejný, jen většina uživatelů fotí přímo mobilem — proto ukázka vypadá jako telefon.",
    },
    {
      question: "Kolik to stojí?",
      answer:
        "Založení účtu je zdarma. Počet aktivních inzerátů závisí na balíčku — aktuální limity najdete v sekci Balíčky inzerce v patičce.",
    },
  ],
} as const;

/** @deprecated Použij CREATE_LISTING_GUIDE_DEMOS / getCreateListingGuideDemo. */
export const CREATE_LISTING_GUIDE_DEMO = getCreateListingGuideDemo("bike");

/** @deprecated */
export const CREATE_LISTING_GUIDE_DEMO_IMAGE = "/images/guide/demo-kolo.jpg";
