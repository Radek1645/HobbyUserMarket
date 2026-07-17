import { ABOUT_PLATFORM_PATH } from "@/config/about-platform";
import { CREATE_LISTING_GUIDE_PATH } from "@/config/create-listing-guide";
import { SITE_SHORT_NAME } from "@/config/site";

/** SEO body text pod výpisem inzerátů na homepage. */
export const HOME_SEO_BLURB = {
  heading: "Lokální bazar a inzerce ve vašem okolí",
  paragraphs: [
    `${SITE_SHORT_NAME} je moderní lokální bazar — online inzerce zboží, služeb, práce, nemovitostí i událostí blízko vás. Inzerát založíte během pár minut: stačí fotka a krátký popis, AI doplní detaily.`,
    "Prodejte přebytky, nabídněte službu nebo najděte výpomoc bez zbytečné omáčky.",
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
