/**
 * Hard-hit frází — zamítnutí PŘED Gemini (fail closed).
 * Oddělené od PROHIBITED_TOPICS (běžný keyword scan / AI kritéria).
 * Sync: npm run sync:moderation
 */

export type HardHitCategory = {
  /** Stabilní ID pro logy / evidence.matched_category */
  id: string;
  label: string;
  /** Fráze po normalizaci (lowercase, bez diakritiky) — praktický set, ne encyklopedie. */
  terms: readonly string[];
};

/**
 * Těžce zakázaný text (hlavně CSAM). Při hit → REJECTED + evidence, Gemini se nevolá.
 * Termíny drž krátké a jednoznačné; vyhýbej se obecným slovům s vysokým false positive.
 */
export const HARD_HIT_CATEGORIES: readonly HardHitCategory[] = [
  {
    id: "csam",
    label: "CSAM / zneužívání dětí",
    terms: [
      "csam",
      "child porn",
      "childporn",
      "child pornography",
      "cp video",
      "pedo",
      "pedofil",
      "paedophil",
      "underage sex",
      "underage porn",
      "underage nude",
      "detske porno",
      "detska pornografie",
      "detsky porno",
      "pornografie deti",
      "broskvicka",
      "p3do",
      "ch1ld porn",
      "ch1ldporn",
    ],
  },
] as const;

export type HardHitCategoryId = (typeof HARD_HIT_CATEGORIES)[number]["id"];
