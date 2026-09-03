import { LISTING_QUOTA_FREE_DEFAULT } from "@/config/app";
import { getHomeCategoryFilterHref } from "@/config/category-seo";
import { getCreateListingGuideDemo } from "@/config/create-listing-guide";
import { SITE_DISPLAY_NAME, SITE_SHORT_NAME } from "@/config/site";
import type { CategoryType } from "@/types/post";

/** Landing page pro Facebook reklamu — `/prodejte-snadno`. */
export const FB_PROMO_LANDING_PATH = "/prodejte-snadno";

export const FB_PROMO_LANDING_HOW_IT_WORKS_ID = "jak-to-funguje";

export const FB_PROMO_CREATE_LISTING_PATH = "/inzerat/novy";

export function isFbPromoLandingPath(pathname: string | null): boolean {
  return pathname === FB_PROMO_LANDING_PATH;
}

/** dataLayer event — načtení landing page (denominátor A/B). */
export const GTM_LP_VIEW_EVENT = "lp_view";

const routerDemo = getCreateListingGuideDemo("router");

export const FB_PROMO_LANDING_UI = {
  footerLinkLabel: "Prodejte snadno",
  metaTitle: `Vyfoťte to. Zbytek dopíše AI. | ${SITE_DISPLAY_NAME}`,
  metaDescription: `Nahrajete fotku, napíšete pár slov a AI z toho sestaví hotový inzerát. Párkrát kliknout a je to venku — lokální bazar Brno a okolí. Prvních ${LISTING_QUOTA_FREE_DEFAULT} inzerátů zdarma, bez provizí.`,
  badge: "Lokální bazar · Brno a okolí",
  heroTitleLine1: "Vyfoťte to.",
  heroTitleLine2: "Zbytek dopíše AI.",
  heroSubtitle:
    "Nahrajete fotku, napíšete pár slov a AI z toho sestaví hotový inzerát — název, popis, parametry i kategorii. Párkrát kliknout a je to venku, rovnou pro lidi z vašeho okolí.",
  headerHowItWorks: "Jak to funguje",
  headerCta: "Vložit inzerát",
  heroCta: "Vložit inzerát zdarma",
  heroCtaHint:
    "Začít můžete hned. Přihlásíte se až před publikací — Google nebo e-mailem.",
  bullets: [
    `${LISTING_QUOTA_FREE_DEFAULT} inzerátů zdarma`,
    "Bez provizí z prodeje",
    "Český projekt",
  ] as const,
  stepsEyebrow: "Jak to funguje",
  stepsTitle: "Tři kroky, pár kliknutí",
  steps: [
    {
      title: "Vyfotíte věc",
      text: "Mobilem, u okna, na stole. Jedna dobrá fotka stačí — klidně přidejte i štítek s modelem.",
    },
    {
      title: "Napíšete pár slov",
      text: "„Starý router, funguje.“ Když bude něco chybět, AI se sama doptá.",
    },
    {
      title: "Zkontrolujete návrh a publikujete",
      text: "Ještě vyplníte stav, lokalitu a cenu. Text si přečtete, případně upravíte, a dáte publikovat. Poslední text je vždycky váš.",
    },
  ] as const,
  aiEyebrow: "Co za vás udělá AI",
  aiTitle: "Z jedné věty udělá inzerát, který jde najít",
  aiLead:
    "Cenu si vždycky určujete vy. AI vám jen řekne, když jí přijde nezvykle vysoká nebo nízká — sama ji nedoplňuje.",
  aiTiles: [
    {
      title: "Název a popis",
      text: "Srozumitelně, ve správné kategorii.",
      accent: false,
    },
    {
      title: "Parametry",
      text: "Model, stav, rozměry — co je z fotky poznat.",
      accent: false,
    },
    {
      title: "SEO pro vyhledávače",
      text: "Inzerát se dá najít i z Googlu.",
      accent: false,
    },
    {
      title: "Kontrola ceny",
      text: "Upozorní, když je cena moc vysoká nebo nízká.",
      accent: true,
    },
  ] as const,
  kidsTitle: "Dětský bazar bez psaní",
  kidsText:
    "Autosedačka, kočárek, bunda po starším dítěti. Nafotíte celou hromadu věcí za jeden večer a nemusíte u každé vymýšlet popis. Kupující jsou z vašeho okolí, takže odvoz je většinou o dvě zastávky.",
  kidsCta: "Projít dětský bazar",
  kidsHref: getHomeCategoryFilterHref("detsky"),
  categoriesTitle: "Co se u nás prodává",
  categoriesHint:
    "Inzeráty se dají filtrovat podle obce, takže vidíte hlavně to, co je poblíž.",
  faqTitle: "Časté dotazy",
  closingTitle: "Vyberte si doma jednu věc a zkuste to",
  closingText: `Vyfotíte, napíšete pár slov, vyplníte stav, lokalitu a cenu a dáte publikovat. Přihlásíte se až na konci — Google nebo e-mailem. Prvních ${LISTING_QUOTA_FREE_DEFAULT} je zdarma.`,
  mockupBeforeEyebrow: "Co napíšete",
  mockupBeforeText: "„Starý router, funguje“",
  mockupBannerTitle: "AI vám vylepšila inzerát",
  mockupBannerHint: "Zkontrolujte prosím text.",
  mockupTitleLabel: "Název",
  mockupTitleValue: "Wi-Fi 6 router NL-AX3000",
  mockupDescriptionLines: [
    "Model: NL-AX3000",
    "Wi-Fi 6, dual-band 2,4/5 GHz",
    "4× Gigabit LAN",
    "Plně funkční, bez balení",
  ] as const,
  mockupPriceLabel: "Cena — zadáváte vy",
  mockupPriceValue: "890 Kč",
  mockupPublish: "Publikovat inzerát",
  mockupBrand: SITE_SHORT_NAME,
  mockupPhotoSrc: routerDemo.imageSrc ?? "/images/guide/demo-router.png",
  mockupPhotoAlt: routerDemo.imageAlt,
  mockupLabelSrc:
    routerDemo.labelImageSrc ?? "/images/guide/demo-router-stittek.png",
  mockupLabelAlt: "Štítek s modelem na spodku routeru",
} as const;

export type FbPromoLandingFaqItem = {
  question: string;
  answer: string;
};

export const FB_PROMO_LANDING_FAQ: readonly FbPromoLandingFaqItem[] = [
  {
    question: "Musím se registrovat?",
    answer:
      "Inzerát můžete začít připravovat hned. Před publikací se přihlásíte — jedním klikem přes Google, nebo klasicky e-mailem.",
  },
  {
    question: "Kolik to stojí?",
    answer: `Prvních ${LISTING_QUOTA_FREE_DEFAULT} inzerátů máte zdarma a z prodeje si nebereme provizi.`,
  },
  {
    question: "Určuje cenu AI?",
    answer:
      "Ne. Cenu zadáváte vy. AI vám jen dá vědět, pokud vypadá nezvykle vysoko nebo nízko.",
  },
  {
    question: "Jak si předáme věc?",
    answer:
      "Domluvu si řešíte přímo mezi sebou. Protože inzeráty jsou lokální, většinou jde o osobní předání.",
  },
];

export type FbPromoLandingCategoryChip = {
  href: string;
  label: string;
  category: CategoryType | "sluzby-prace";
};

export const FB_PROMO_LANDING_CATEGORY_CHIPS: readonly FbPromoLandingCategoryChip[] =
  [
    {
      href: getHomeCategoryFilterHref("detsky"),
      label: "Dětský bazar",
      category: "detsky",
    },
    {
      href: getHomeCategoryFilterHref("elektro"),
      label: "Elektro",
      category: "elektro",
    },
    {
      href: getHomeCategoryFilterHref("dum"),
      label: "Dům a zahrada",
      category: "dum",
    },
    {
      href: getHomeCategoryFilterHref("moda"),
      label: "Móda",
      category: "moda",
    },
    {
      href: getHomeCategoryFilterHref("sport"),
      label: "Sport",
      category: "sport",
    },
    {
      href: getHomeCategoryFilterHref("auto"),
      label: "Auto-moto",
      category: "auto",
    },
    {
      href: getHomeCategoryFilterHref("hobby"),
      label: "Hobby",
      category: "hobby",
    },
    {
      href: getHomeCategoryFilterHref("sluzby"),
      label: "Služby a práce",
      category: "sluzby-prace",
    },
    {
      href: getHomeCategoryFilterHref("udalost"),
      label: "Události",
      category: "udalost",
    },
  ];
