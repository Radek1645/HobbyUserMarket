const MODERATION_STATUSES = ["APPROVED", "REJECTED", "NEEDS_QUESTIONS"];
const CATEGORY_FITS = ["match", "better_existing", "missing_taxonomy"];

const nullableGeminiString = { type: "STRING", nullable: true };
const nullableOpenAiString = { type: ["string", "null"] };

/**
 * Provider-native schema pro Gemini structured output.
 * Bez `additionalProperties` — Gemini REST ho v response_schema odmítá (HTTP 400).
 */
export const GEMINI_MODERATION_RESPONSE_SCHEMA = {
  type: "OBJECT",
  required: [
    "status",
    "reason",
    "rejectedTopicId",
    "rejectedImageIndex",
    "cleanedTitle",
    "metaDescription",
    "imageAlt",
    "cleanedDescription",
    "questions",
    "categorySuggestion",
  ],
  properties: {
    status: { type: "STRING", enum: MODERATION_STATUSES },
    reason: nullableGeminiString,
    rejectedTopicId: nullableGeminiString,
    rejectedImageIndex: { type: "INTEGER", nullable: true, minimum: 0 },
    cleanedTitle: nullableGeminiString,
    metaDescription: nullableGeminiString,
    imageAlt: nullableGeminiString,
    cleanedDescription: nullableGeminiString,
    questions: {
      type: "ARRAY",
      maxItems: 5,
      items: {
        type: "OBJECT",
        required: ["id", "label", "paramLabel"],
        properties: {
          id: { type: "STRING" },
          label: { type: "STRING" },
          paramLabel: nullableGeminiString,
        },
      },
    },
    categorySuggestion: {
      type: "OBJECT",
      nullable: true,
      required: ["fit", "categoryType", "subcategorySlug", "hint"],
      properties: {
        fit: { type: "STRING", enum: CATEGORY_FITS },
        categoryType: nullableGeminiString,
        subcategorySlug: nullableGeminiString,
        hint: nullableGeminiString,
      },
    },
  },
} as const;

/** Strict JSON Schema pro OpenAI response_format=json_schema. */
export const OPENAI_MODERATION_RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "status",
    "reason",
    "rejectedTopicId",
    "rejectedImageIndex",
    "cleanedTitle",
    "metaDescription",
    "imageAlt",
    "cleanedDescription",
    "questions",
    "categorySuggestion",
  ],
  properties: {
    status: { type: "string", enum: MODERATION_STATUSES },
    reason: nullableOpenAiString,
    rejectedTopicId: nullableOpenAiString,
    rejectedImageIndex: { type: ["integer", "null"], minimum: 0 },
    cleanedTitle: nullableOpenAiString,
    metaDescription: nullableOpenAiString,
    imageAlt: nullableOpenAiString,
    cleanedDescription: nullableOpenAiString,
    questions: {
      type: "array",
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "label", "paramLabel"],
        properties: {
          id: { type: "string" },
          label: { type: "string" },
          paramLabel: nullableOpenAiString,
        },
      },
    },
    categorySuggestion: {
      anyOf: [
        { type: "null" },
        {
          type: "object",
          additionalProperties: false,
          required: ["fit", "categoryType", "subcategorySlug", "hint"],
          properties: {
            fit: { type: "string", enum: CATEGORY_FITS },
            categoryType: nullableOpenAiString,
            subcategorySlug: nullableOpenAiString,
            hint: nullableOpenAiString,
          },
        },
      ],
    },
  },
} as const;

/**
 * Schema pro photo-first prefill (suggest-listing-from-photos).
 * Closed vocabulary categoryType/subcategorySlug vynucuje Edge validace + prompt.
 */
export const GEMINI_SUGGEST_LISTING_RESPONSE_SCHEMA = {
  type: "OBJECT",
  required: [
    "title",
    "description",
    "categoryType",
    "subcategorySlug",
    "confidenceScore",
  ],
  properties: {
    title: { type: "STRING", maxLength: 80 },
    description: { type: "STRING", maxLength: 2000 },
    categoryType: { type: "STRING" },
    subcategorySlug: { type: "STRING", nullable: true },
    confidenceScore: { type: "NUMBER", minimum: 0, maximum: 1 },
  },
} as const;

/** OpenAI structured output ekvivalent GEMINI_SUGGEST_LISTING_RESPONSE_SCHEMA. */
export const OPENAI_SUGGEST_LISTING_RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "title",
    "description",
    "categoryType",
    "subcategorySlug",
    "confidenceScore",
  ],
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    categoryType: { type: "string" },
    subcategorySlug: nullableOpenAiString,
    confidenceScore: { type: "number" },
  },
} as const;
