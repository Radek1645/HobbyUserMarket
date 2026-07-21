import { ABOUT_PLATFORM_PATH } from "@/config/about-platform";
import { CREATE_LISTING_GUIDE_PATH } from "@/config/create-listing-guide";
import { SITE_SHORT_NAME } from "@/config/site";

/** SEO body text pod výpisem inzerátů na homepage. */
export const HOME_SEO_BLURB = {
  heading: "Lokální bazar a inzerce ve vašem okolí",
  paragraphs: [
    `${SITE_SHORT_NAME} je lokální bazar — online inzerce zboží, služeb, práce, nemovitostí i událostí blízko vás. Stačí fotka a krátký popis; AI připraví strukturovaný inzerát, který jde dobře najít ve vyhledávačích i v okolí.`,
    "Nabídněte věc nebo službu, hledejte práci, bydlení či výpomoc — domluvu si řešíte přímo mezi sebou.",
  ],
  links: [
    {
      href: ABOUT_PLATFORM_PATH,
      label: "Co je zaPikolou",
    },
    {
      href: CREATE_LISTING_GUIDE_PATH,
      label: "Jak vytvořit inzerát",
    },
  ],
  linksIntro: "Více o platformě na stránce",
  linksJoin: "a v průvodci",
} as const;
