import { LISTING_QUOTA_FREE_DEFAULT } from "@/config/app";
import { LISTING_AI_DISCLOSURE } from "@/config/moderation";
import { SITE_DISPLAY_NAME, SITE_OPERATOR_CONTACT_EMAIL } from "@/config/site";

/** Veřejné FAQ — PRD §11.3. */

export const FAQ_PATH = "/faq";

export type FaqItem = {
  id: string;
  question: string;
  /** Plain text; zmínky VOP / Podmínek inzerce / GDPR linkuje `LegalLinkedText`. */
  answer: string;
};

export const FAQ_UI = {
  footerLinkLabel: "Časté dotazy",
  metaTitle: `Časté dotazy | ${SITE_DISPLAY_NAME}`,
  metaDescription: `Odpovědi na časté otázky o ${SITE_DISPLAY_NAME} — kontakt, kvalita inzerátu, AI, rozdíl oproti bazarům, účet a soukromí. Lidsky, bez právnické češtiny.`,
  pageTitle: "Časté dotazy",
  intro:
    "Krátké odpovědi na to, co se lidí ptá nejčastěji. Podrobnosti najdete ve VOP a v Podmínkách inzerce.",
} as const;

/**
 * Min. 5 položek odvozených z VOP / provozu — tón PRD §1.6.
 * Novou položku přidej sem (id stabilní kvůli kotvám / a11y).
 */
export const FAQ_ITEMS: readonly FaqItem[] = [
  {
    id: "kontakt",
    question: "Jak funguje kontakt na inzerenta?",
    answer:
      "Kontakt (telefon a e-mail) schováváme kvůli ochraně soukromí — aby inzerenty nezahltila spam, roboti ani náhodní sběrači čísel. Údaje uvidíte až po přihlášení a kliknutí na „Zobrazit kontakt“. Druhá cesta je poptávka přes formulář na detailu: zpráva přijde inzerentovi e-mailem a detaily si domluvíte mezi sebou.",
  },
  {
    id: "v-cem-jine",
    question: "Čím se zaPikolou liší od ostatních inzertních webů?",
    answer:
      "Nejsme jen klasická nástěnka ani reklamní systém na proklik. Jde nám o vytvoření inzerátu, který umí prodat: z fotky a pár slov připravíme srozumitelný text, pomůžeme doplnit chybějící detaily a ukážeme, jak je inzerát připravený. Zároveň zůstáváme lokální — spojujeme lidi v okolí, obchod si domluvíte mezi sebou a z prodeje si nic nebereme.",
  },
  {
    id: "kvalita-inzeratu",
    question: "Co znamená Kvalita u inzerátu a proč mám odpovídat na otázky AI?",
    answer:
      "U náhledu inzerátu uvidíte ukazatel „Kvalita“ v procentech — jak je nabídka úplná a připravená (fotky, text, doplněné údaje). Pod procenty je tip, co doplnit do 100 % — typicky delší úvod popisu nebo odpovědi na otázky AI. Texty pro vyhledávače připraví AI sama; kvalitu neovlivňují. Když něco doplníte, procenta se hned zvednou. Není to odhad, jestli se věc určitě prodá, ani trest: i s nižším skóre můžete publikovat. AI se ptá jen na to, co v textu nebo na fotkách chybí a co kupující často potřebují vědět. Odpovědi jsou dobrovolné, ale doplní se do Parametrů a inzerát je pak srozumitelnější.",
  },
  {
    id: "vytvoreno-s-pomoci-ai",
    question: `Co znamená „${LISTING_AI_DISCLOSURE.paramLabel}“ u inzerátu?`,
    answer: `${LISTING_AI_DISCLOSURE.paramHelp} Štítek „${LISTING_AI_DISCLOSURE.paramLabel}: ${LISTING_AI_DISCLOSURE.paramValueYes}“ uvidíte v Parametrech, když inzerent při publikaci použije AI návrh textu. Finální znění vždy schvaluje inzerent — může ho upravit, nebo zvolit svůj původní text bez tohoto označení.`,
  },
  {
    id: "inzerat-zmizi",
    question: "Co když mi inzerát zmizí z výpisu?",
    answer:
      "Nejčastěji vypršela platnost — v Moje inzeráty ho uvidíte jako expirovaný a můžete ho prodloužit. Mohl jste ho také pozastavit (pauza). Když inzerát porušuje pravidla, může ho schovat moderace nebo automatika po několika nahlášeních — pak ho znovu zveřejníte až po úpravě a schválení. Podrobnosti jsou v Podmínkách inzerce.",
  },
  {
    id: "smazat-ucet",
    question: "Jak smažu účet?",
    answer:
      "Jděte do Profil → Nastavení a použijte smazání účtu. Budete muset potvrdit e-mail a souhlas. Smazáním zanikne účet a související data podle Zásad ochrany osobních údajů — včetně všech inzerátů (nejen aktivních). Pro další inzerci si budete muset založit nový profil.",
  },
  {
    id: "co-smi-inzerovat",
    question: "Co smím inzerovat?",
    answer:
      "Lokální nabídky zboží, služeb, nemovitostí, událostí a práce v okolí — prostě vše, kromě věcí, které porušují Podmínky inzerce. Při založení inzerát kontroluje i automatická moderace (včetně fotek).",
  },
  {
    id: "moderace",
    question: "Jak funguje kontrola inzerátů?",
    answer:
      "Před zveřejněním projde text a fotky bezpečnostní kontrolou. Někdy se vás AI zeptá na chybějící údaje a navrhne úpravy textu — finální znění schvalujete vy. Podezřelý inzerát nahlásíte přímo z jeho detailu (po přihlášení), nebo přes formulář Nahlásit inzerát v patičce. Po více nahlášeních se může schovat a podívá se na něj moderátor.",
  },
  {
    id: "okoli",
    question: "Proč vidím inzeráty z okolí a ne z celé republiky?",
    answer:
      "zaPikolou je lokální nástěnka. Když povolíte polohu (nebo ji nastavíte v hlavičce), ukazujeme nejbližší nabídky. Když jich v okruhu není dost, doplníme novější inzeráty z celé ČR a napíšeme vám to.",
  },
  {
    id: "platba",
    question: "Platí se za inzerci?",
    answer:
      `Ne. Inzerce je zdarma v rámci limitu — nový účet dostane ${LISTING_QUOTA_FREE_DEFAULT} lifetime publikací (každá první publikace spotřebuje 1 kredit; smazání kredit nevrací). ` +
      `Aktuální limity jsou v sekci Limity inzerce. ` +
      `Potřebujete víc publikací, než je startovní limit? Napište na ${SITE_OPERATOR_CONTACT_EMAIL}. ` +
      `Zprostředkování obchodu mezi vámi neřešíme a z prodeje si nebereme provizi.`,
  },
];
