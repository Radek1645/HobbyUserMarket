/** Uživatelské texty moderace — uprav copy zde (PRD §1.6 Tone of Voice). */

/** Cesta stránky z patičky (zatím stub). */
export const LISTING_TERMS_PATH = "/podminky-inzerce";

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

export const MODERATION_PREVIEW_UI = {
  title: "AI náhled a doplnění",
  intro:
    "AI navrhla upravený popis inzerátu. Návrh můžete dál upravit, nebo publikovat původní text.",
  titleLabel: "Název inzerátu",
  descriptionLabel: "Popis inzerátu",
  questionsHeading: "Vylepšete svůj inzerát",
  questionsHint:
    "Vaše odpovědi doplníme do popisu. Otázky můžete přeskočit a publikovat beze změn.",
  questionRequiredMark: " (povinné)",
  questionsIncompleteWarning: "Vyplňte všechny otázky výše.",
  publishAiLabel: "Publikovat s vylepšeným popisem",
  publishAiHint: "Doporučeno",
  publishOriginalLabel: "Publikovat bez vylepšení",
  publishOriginalHint:
    "Kontaktní údaje v popisu se automaticky skryjí.",
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

export const MODERATION_GEMINI_QUOTA_ERROR =
  "Limit AI dotazů u Google je dočasně vyčerpaný. Zkuste to prosím za minutu znovu.";

export const MODERATION_RATE_LIMIT_MESSAGE = (limit: number) =>
  `Příliš mnoho AI kontrol. Zkuste to prosím znovu za chvíli (max. ${limit} za hodinu).`;
