import { SITE_DISPLAY_NAME, SITE_SHORT_NAME } from "@/config/site";
import { VOP_PATH } from "@/config/legal";

/** SEO stránka — co je platforma (odkaz z patičky). */
export const ABOUT_PLATFORM_PATH = "/co-je-zapikolou";

export const ABOUT_PLATFORM_UI = {
  footerLinkLabel: "O platformě",
  metaTitle: `Online bazar a inzerce | ${SITE_DISPLAY_NAME}`,
  metaDescription: `${SITE_SHORT_NAME} — online bazar a inzerce pro zboží, služby, práci, nemovitosti a akce ve vašem okolí. Neprodáváme za vás — propojujeme inzerenty a zájemce.`,
  pageTitle: "Co je zaPikolou?",
  lead:
    "Jsme lokální inzertní nástěnka — místo, kde lidé ve vašem okolí nabízejí a hledají věci, služby, práci, bydlení nebo akce.",
  sections: [
    {
      title: "Inzertní nástěnka, ne obchod",
      body: "zaPikolou.cz není e-shop ani zprostředkovatel obchodu. Nepřebíráme roli prodejce, kupujícího, zaměstnavatele ani pronajímatele. Inzeráty vkládají sami uživatelé a domluvu mezi sebou si řeší přímo.",
    },
    {
      title: "Co u nás najdete",
      body: "Na platformě můžete zveřejnit nabídku nebo poptávku zboží, služeb, pracovních příležitostí, nemovitostí a událostí. Cílem je jednoduché a rychlé propojení lidí v okolí — bez složitého formuláře a s pomocí AI při psaní inzerátu.",
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
