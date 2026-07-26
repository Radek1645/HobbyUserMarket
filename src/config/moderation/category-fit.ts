/** AI telemetrie — shoda zvolené kategorie s obsahem inzerátu. */
export const CATEGORY_FIT = {
  match: "match",
  betterExisting: "better_existing",
  missingTaxonomy: "missing_taxonomy",
} as const;

export type CategoryFit = (typeof CATEGORY_FIT)[keyof typeof CATEGORY_FIT];

export const CATEGORY_FIT_VALUES = Object.values(CATEGORY_FIT);

export const CATEGORY_TAXONOMY_HINT_MAX_LENGTH = 120;
