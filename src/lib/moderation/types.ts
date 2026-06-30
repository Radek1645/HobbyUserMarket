import type { CategoryType } from "@/types/post";

export type ModerationIntent = "create" | "update";

export type ModerationStatus = "APPROVED" | "REJECTED" | "NEEDS_QUESTIONS";

export type ModerateListingRequest = {
  intent: ModerationIntent;
  title: string;
  description: string;
  categoryType: CategoryType;
  subcategorySlug: string;
  /** Všechny nahrané fotky (max. 6) — bezpečnostní filtr. */
  imagesBase64?: string[];
  /** Index hlavní fotky v `imagesBase64` — cross-validace textu a hydratace. */
  mainImageIndex?: number;
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
  /** 0-based index fotky, která porušila pravidla (volitelně). */
  rejectedImageIndex?: number;
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
  images?: {
    imagesBase64: string[];
    mainImageIndex: number;
  };
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
