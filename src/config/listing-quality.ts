/** Kvalita inzerátu po hydrataci — rubric a copy (ne „šance na prodej“). */

/** Kotva sekce „Vylepšete svůj inzerát“ v ModerationPreviewDialog. */
export const IMPROVE_LISTING_SECTION_ID = "improve-listing";

/** Bez fotky score nesmí přesáhnout tento strop. */
export const LISTING_QUALITY_NO_PHOTO_SCORE_CAP = 25;

/** Minimální délka úvodu popisu pro plné body za text. */
export const LISTING_QUALITY_INTRO_GOOD_MIN_CHARS = 80;

/** Váhy bodů — součet = 100. */
export const LISTING_QUALITY_POINTS = {
  photos: 40,
  description: 25,
  questions: 25,
  seoMeta: 5,
  seoAlt: 5,
} as const;

export type ListingQualityBand =
  | "excellent"
  | "good"
  | "fair"
  | "weak"
  | "poor";

export type ListingQualityTipCode =
  | "missing_photo"
  | "needs_answers"
  | "needs_info"
  | "can_improve"
  | "perfect";

export const LISTING_QUALITY_UI = {
  scoreLabel: "Kvalita",
  scoreAriaLabel: (score: number) => `Kvalita inzerátu ${score} %`,
  tips: {
    missing_photo: "Chybí fotka — výrazně pomáhá.",
    needs_answers: "Tip: doplňte odpovědi níže.",
    needs_info: "Inzerát potřebuje doplnit informace.",
    can_improve: "Tip: doplňte detaily níže.",
    perfect: "Inzerát je v pořádku.",
  },
  scrollToImproveAriaLabel: "Přejít na sekci Vylepšete svůj inzerát",
} as const;

/** Mapuje score 0–100 na pásmo pro barvu a výchozí tip. */
export function getListingQualityBand(score: number): ListingQualityBand {
  if (score >= 90) return "excellent";
  if (score >= 70) return "good";
  if (score >= 50) return "fair";
  if (score >= 20) return "weak";
  return "poor";
}

/** Tailwind třídy pro procento podle pásma. */
export function getListingQualityScoreClass(band: ListingQualityBand): string {
  switch (band) {
    case "excellent":
      return "text-emerald-700";
    case "good":
      return "text-emerald-600/90";
    case "fair":
      return "text-amber-700";
    case "weak":
      return "text-amber-800";
    case "poor":
      return "text-red-700";
  }
}
