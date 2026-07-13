import { SITE_DISPLAY_NAME, SITE_SHORT_NAME } from "@/config/site";

/** SEO stránka — jak jednoduše založit inzerát (odkaz z patičky). */
export const CREATE_LISTING_GUIDE_PATH = "/jak-vytvorit-inzerat";

export const CREATE_LISTING_GUIDE_UI = {
  footerLinkLabel: "Jak vytvořit inzerát",
  metaTitle: `Jak vytvořit inzerát za 2 minuty | ${SITE_DISPLAY_NAME}`,
  metaDescription: `Vyfoťte věc mobilem, napište pár slov a AI na ${SITE_SHORT_NAME} doplní popis. Ukázka ve 4 krocích — včetně kontroly obsahu.`,
  pageTitle: "Jak snadno lze vytvořit inzerát do dvou minut?",
  ctaLabel: "Vytvořit inzerát s AI",
  ctaHint: "Registrace zabere chvíli — pak rovnou fotíte a píšete.",
  steps: [
    {
      number: 1,
      title: "Vyfoťte nebo nahrajte fotku a napište krátký popisek",
      body: "Vyberete kategorii, vyfotíte věc nebo nahrajete fotku z galerie a napíšete pár slov. Nemusíte psát román — stačí „Prodám kolo“ a krátká věta.",
    },
    {
      number: 2,
      title: "Zkontrolujeme, že obsah sedí",
      body: "Po kliknutí na Publikovat ověříme, že text odpovídá fotkám a splňuje pravidla inzerce. Když něco nesedí, řekneme vám to hned.",
    },
    {
      number: 3,
      title: "AI upraví text za vás",
      body: "Projde-li kontrola, AI navrhne upravený popis, doplní parametry z fotky a zeptá se jen na to, co chybí. Návrh si můžete ještě upravit.",
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

/** Ukázková fotka na mockupech průvodce (public/images/guide/). */
export const CREATE_LISTING_GUIDE_DEMO_IMAGE = "/images/guide/demo-kolo.jpg";

/** Ukázkový scénář na mockupech — prodej kola z mobilu. */
export const CREATE_LISTING_GUIDE_DEMO = {
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
} as const;
