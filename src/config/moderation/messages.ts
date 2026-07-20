/** Uživatelské texty moderace — uprav copy zde (PRD §1.6 Tone of Voice). */

/** Cesta stránky z patičky (zatím stub). */
export const LISTING_TERMS_PATH = "/podminky-inzerce";

/** Označení AI textu na detailu inzerátu — Podmínky inzerce §3, AI Act. */
export const LISTING_AI_DISCLOSURE = {
  paramLabel: "Vytvořeno s pomocí AI",
  paramValueYes: "Ano",
  paramHelp:
    "Inzerát nenapsala AI od nuly. AI text zkontrolovala a doplnila chybějící údaje podle zadání inzerenta a fotografií.",
} as const;

/** @deprecated Prefer LISTING_AI_DISCLOSURE.paramLabel */
export const LISTING_AI_DISCLOSURE_LABEL = LISTING_AI_DISCLOSURE.paramLabel;

export const MODERATION_REJECTION_UI = {
  title: "Inzerát nesplňuje podmínky inzerce",
  intro:
    "Obsah nelze publikovat. Upravte název nebo popis tak, aby odpovídal pravidlům lokálního tržiště.",
  termsLinkLabel: "Podmínky inzerce",
  closeLabel: "Rozumím, upravím inzerát",
  summaryHeading: "Na platformě není dovoleno mimo jiné:",
} as const;

export const MODERATION_APPROVED_UI = {
  title: "Inzerát je v pořádku",
  intro:
    "AI kontrola proběhla úspěšně. Obsah splňuje podmínky inzerce a můžete pokračovat.",
  introEdit:
    "AI kontrola proběhla úspěšně. Obsah splňuje podmínky inzerce a je správně napsaný.",
  continueLabel: "Pokračovat",
  continueLabelEdit: "Uložit změny",
} as const;

export const MODERATION_CHECKING_UI = {
  title: "Probíhá AI kontrola inzerátu",
  hint: "Může to trvat i 15 sekund.",
  disclaimer:
    "AI může udělat chybu — před publikací si text vždy zkontrolujte.",
} as const;

export const MODERATION_PREVIEW_UI = {
  title: "AI vám vylepšila inzerát!",
  subtitle:
    "AI může udělat chybu — před publikací si text zkontrolujte. Můžete publikovat vylepšený text, nebo ponechat svůj původní — obojí je v pořádku. U AI textu se v Parametrech zobrazí „Vytvořeno s pomocí AI: Ano“.",
  titleLabel: "Název inzerátu",
  descriptionLabel: "Popis inzerátu",
  seoSectionLabel: "Texty pro vyhledávače",
  seoSectionHint: "Meta popis a alt fotky — volitelné, ale pomáhají ve výsledcích hledání.",
  seoEditAriaLabel: "Odemknout úpravy textů pro vyhledávače",
  seoLockAriaLabel: "Zamknout úpravy textů pro vyhledávače",
  seoLockedHint: "Pro úpravu klikněte na tužku.",
  metaDescriptionLabel: "Meta popis (vyhledávače)",
  metaDescriptionHelp:
    "Zobrazí se ve výsledcích Googlu a Seznamu a zvyšuje viditelnost.",
  imageAltLabel: "Alt text hlavní fotky",
  imageAltHelp: "Popis fotky pro vyhledávače obrázků (bez lokality).",
  questionsHeading: "Vylepšete svůj inzerát",
  questionsHint:
    "Odpovězte na to, co kupující nejvíc zajímá. Urychlíte prodej a vyhnete se zbytečným otázkám v chatu.",
  questionsSkipHint:
    "Nevíte odpověď? Nechte prázdné — publikaci to nezdrží.",
  publishAiLabel: "Publikovat vylepšený inzerát",
  publishAiHint: "Doporučeno",
  publishOriginalLabel: "Ponechat můj původní text",
  publishOriginalHint:
    "Obě cesty jsou v pořádku. Tato volba zahodí AI návrh a publikuje váš původní text. Kontaktní údaje v popisu se automaticky skryjí.",
  descriptionLengthWarning: (current: number, max: number) =>
    `Popis včetně odpovědí má ${current} znaků — maximum je ${max}. Zkrácením textu nebo odpovědí to vejde.`,
  descriptionLengthCounter: (current: number, max: number) =>
    `${current} / ${max} znaků`,
  cancelLabel: "Zrušit",
} as const;

export const MODERATION_DEFAULT_REJECTION_REASON =
  "Inzerát obsahuje zakázaný obsah nebo porušuje pravidla platformy.";

export const MODERATION_TECHNICAL_ERROR =
  "AI kontrola teď nefunguje. Zkuste to prosím za chvíli znovu.";

/** Panel technické chyby AI (U1) — ne obsahové zamítnutí. */
export const MODERATION_TECHNICAL_UI = {
  title: "Technická chyba",
  retryLabel: "Zkusit znovu",
} as const;

export const MODERATION_GEMINI_QUOTA_ERROR =
  "Limit AI dotazů u Google je dočasně vyčerpaný. Zkuste to prosím za minutu znovu.";

export const MODERATION_RATE_LIMIT_MESSAGE = (limit: number) =>
  `Příliš mnoho AI kontrol. Zkuste to prosím znovu za chvíli (max. ${limit} za hodinu).`;
