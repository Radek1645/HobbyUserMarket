/**
 * Staff lab: srovnání dvou modelů pro photo-first prefill.
 * Edge: compare-suggest-from-photos — oddělená od produkčního suggestu.
 */

export const COMPARE_SUGGEST_FUNCTION_NAME =
  "compare-suggest-from-photos" as const;

export const COMPARE_SUGGEST_MAX_IMAGES = 2;

export const COMPARE_SUGGEST_DEFAULT_ARM_A = {
  label: "A",
  provider: "gemini" as const,
  model: "gemini-3.5-flash-lite",
};

export const COMPARE_SUGGEST_DEFAULT_ARM_B = {
  label: "B",
  provider: "openai" as const,
  model: "gpt-5.4-nano",
};

export const COMPARE_SUGGEST_UI = {
  pageTitle: "Prefill lab",
  pageSubtitle:
    "Stejné fotky a prompt, dva modely vedle sebe. Jen pro staff — bez zápisu do DB.",
  armAHeading: "Model A",
  armBHeading: "Model B",
  providerLabel: "Provider",
  modelLabel: "Model",
  dropzoneIdle: "Přidat fotky",
  dropzoneHint: "Maximálně 2 fotky",
  runLabel: "Porovnat",
  runningLabel: "Srovnávám…",
  needPhotos: "Přidejte alespoň jednu fotku.",
  tooManyPhotos:
    "Můžete mít nejvýše 2 fotky. Ponechali jsme poslední dvě — starší jsme vynechali.",
  technicalError: "Srovnání selhalo. Zkuste to znovu.",
  forbidden: "Prefill lab je jen pro moderátory a adminy.",
  latencyLabel: "Latence",
  categoryLabel: "Kategorie",
  subcategoryLabel: "Podkategorie",
  confidenceLabel: "Jistota",
  titleLabel: "Název",
  descriptionLabel: "Popis",
  errorLabel: "Chyba",
  emptySubcategory: "— (null)",
} as const;
