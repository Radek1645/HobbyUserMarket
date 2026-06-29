export {
  buildModerationSystemPrompt,
} from "@/config/moderation/build-prompt";
export {
  LISTING_TERMS_PATH,
  MODERATION_DEFAULT_REJECTION_REASON,
  MODERATION_RATE_LIMIT_MESSAGE,
  MODERATION_REJECTION_UI,
  MODERATION_TECHNICAL_ERROR,
} from "@/config/moderation/messages";
export {
  getProhibitedTopic,
  getProhibitedTopicsSummaryLabels,
  PROHIBITED_TOPICS,
  type ProhibitedTopic,
  type ProhibitedTopicId,
} from "@/config/moderation/prohibited-topics";

/** Volá Edge Function `moderate-listing` před uložením (create i edit). */
export const MODERATION_ENABLED = false;

/** Max. AI kontrol / hodinu / uživatel (PRD). */
export const MODERATION_RATE_LIMIT_PER_HOUR = 5;

export const MODERATION_FUNCTION_NAME = "moderate-listing" as const;
