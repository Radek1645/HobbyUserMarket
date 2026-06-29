import type { CategoryType } from "@/types/post";

export type ModerationIntent = "create" | "update";

export type ModerationStatus = "APPROVED" | "REJECTED" | "NEEDS_QUESTIONS";

export type ModerateListingRequest = {
  intent: ModerationIntent;
  title: string;
  description: string;
  categoryType: CategoryType;
  subcategorySlug: string;
  /** Base64 hlavní fotky — až s uploadem fotek. */
  mainImageBase64?: string;
};

export type ModerationQuestion = {
  id: string;
  label: string;
};

/** JSON z Edge Function `moderate-listing`. */
export type ModerateListingResponse = {
  status: ModerationStatus;
  /** Pro REJECTED — srozumitelná hláška pro uživatele. */
  reason?: string;
  /** ID kategorie z prohibited-topics.ts */
  rejectedTopicId?: string;
  cleanedTitle?: string;
  cleanedDescription?: string;
  questions?: ModerationQuestion[];
};

export type ListingModerationInput = {
  intent: ModerationIntent;
  title: string;
  description: string;
  categoryType: CategoryType;
  subcategorySlug: string;
};

export type ListingModerationSuccess = {
  ok: true;
  /** true = AI se nevolala (vypnuto nebo u editace beze změny obsahu). */
  skipped: boolean;
  cleanedTitle: string;
  cleanedDescription: string;
  questions?: ModerationQuestion[];
};

export type ListingModerationFailure =
  | {
      ok: false;
      kind: "rejected";
      reason: string;
      topicId?: string;
    }
  | {
      ok: false;
      kind: "error";
      error: string;
    };

export type ListingModerationOutcome =
  | ListingModerationSuccess
  | ListingModerationFailure;
