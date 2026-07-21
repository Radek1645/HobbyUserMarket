import { SITE_DISPLAY_NAME, SITE_SHORT_NAME } from "@/config/site";
import { VOP_PATH } from "@/config/legal";

/** SEO stránka — co je platforma (odkaz z patičky). */
export const ABOUT_PLATFORM_PATH = "/co-je-zapikolou";

export const ABOUT_PLATFORM_UI = {
  footerLinkLabel: "O platformě",
  metaTitle: `Online bazar a inzerce | ${SITE_DISPLAY_NAME}`,
  metaDescription: `${SITE_SHORT_NAME} — lokální inzerce s AI: z fotky a krátkého popisu připravíme inzerát, který jde dobře najít ve vyhledávačích i v okolí. Neprodáváme za vás — propojujeme lidi.`,
  pageTitle: "Co je zaPikolou?",
  lead:
    "Jsme lokální inzertní nástěnka s misí: rychle propojit lidi ve vašem okolí — a připravit každý inzerát tak, aby byl srozumitelný lidem i vyhledávačům.",
  sections: [
    {
      title: "Proč existujeme",
      body: "Chceme, aby nabídka z okolí byla vidět tam, kde lidé skutečně hledají — na Googlu, Seznamu i přímo u nás. Nejsme další přeplněný formulář: stačí fotka a krátký nástřel, zbytek pomůžeme dát dohromady.",
    },
    {
      title: "AI inzerát připravený na organiku",
      body: "AI z vašeho nástřelu připraví strukturovaný inzerát: výstižný nadpis, čitelný popis, parametry a texty pro vyhledávače (meta popis, popisek fotky). Cíl je jednoduchý — inzerát, který jde dobře najít organicky podle věci a lokality, ne jen při scrollování na webu. Text před publikací vždy zkontrolujete a můžete upravit.",
    },
    {
      title: "Inzertní nástěnka, ne obchod",
      body: "zaPikolou.cz není e-shop ani zprostředkovatel obchodu. Nepřebíráme roli prodejce, kupujícího, zaměstnavatele ani pronajímatele. Inzeráty vkládají sami uživatelé a domluvu mezi sebou si řeší přímo.",
    },
    {
      title: "Co u nás najdete",
      body: "Zboží, služby, práci, nemovitosti i události. Cílem je rychlé propojení lidí v okolí — bez složitého formuláře a s pomocí AI při psaní inzerátu.",
    },
    {
      title: "Kdo za obsah odpovídá",
      body: "Za text inzerátu, fotky, cenu a průběh dohody odpovídá inzerent. Zájemce si ověřuje podmínky sám. My technicky zajišťujeme zveřejnění, kontrolu obsahu podle pravidel a bezpečné zobrazení kontaktu.",
    },
    {
      title: "Lokálně a s kontrolou",
      body: "Inzeráty se zobrazují ve vašem okolí. Před publikací kontrolujeme, že text sedí k fotkám a splňuje podmínky inzerce. Nelegální nebo nevhodný obsah lze nahlásit — reagujeme podle pravidel platformy.",
    },
  ],
  vopHint: "Podrobná pravidla, odpovědnost a práva uživatelů najdete ve",
  vopLinkLabel: "Všeobecných obchodních podmínkách",
  vopPath: VOP_PATH,
} as const;
