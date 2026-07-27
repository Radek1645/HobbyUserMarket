const MODERATION_STATUSES = ["APPROVED", "REJECTED", "NEEDS_QUESTIONS"];
const CATEGORY_FITS = ["match", "better_existing", "missing_taxonomy"];

const nullableGeminiString = { type: "STRING", nullable: true };
const nullableOpenAiString = { type: ["string", "null"] };

/** Provider-native schema pro Gemini structured output. */
export const GEMINI_MODERATION_RESPONSE_SCHEMA = {
  type: "OBJECT",
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
        additionalProperties: false,
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
      additionalProperties: false,
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
