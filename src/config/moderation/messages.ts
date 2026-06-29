/** Uživatelské texty moderace — uprav copy zde. */

/** Cesta stránky z patičky (zatím stub). */
export const LISTING_TERMS_PATH = "/podminky-inzerce";

export const MODERATION_REJECTION_UI = {
  title: "Inzerát nesplňuje podmínky inzerce",
  intro:
    "Obsah nelze publikovat. Uprav název nebo popis tak, aby odpovídal pravidlům lokálního tržiště.",
  termsLinkLabel: "Podmínky inzerce",
  closeLabel: "Rozumím, upravím inzerát",
  summaryHeading: "Na platformě není dovoleno mimo jiné:",
} as const;

export const MODERATION_DEFAULT_REJECTION_REASON =
  "Inzerát obsahuje zakázaný obsah nebo porušuje pravidla platformy.";

export const MODERATION_TECHNICAL_ERROR =
  "AI kontrola teď nefunguje. Zkus to za chvíli znovu.";

export const MODERATION_RATE_LIMIT_MESSAGE = (limit: number) =>
  `Příliš mnoho AI kontrol. Zkus znovu za chvíli (max. ${limit} za hodinu).`;
