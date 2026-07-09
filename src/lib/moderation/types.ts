import type { CategoryType, ConditionLabel, PriceType } from "@/types/post";

export type ModerationIntent = "create" | "update";

export type ModerationStatus = "APPROVED" | "REJECTED" | "NEEDS_QUESTIONS";

export type ModerateListingRequest = {
  intent: ModerationIntent;
  title: string;
  description: string;
  categoryType: CategoryType;
  subcategorySlug: string;
  /** Hodnota z formuláře (stav / typ úvazku / opakování akce…). */
  conditionLabel?: ConditionLabel;
  /** Lidsky čitelný popisek ke conditionLabel pro AI. */
  conditionLabelText?: string;
  /** Název pole ve formuláři (Stav, Opakování, Typ úvazku…). */
  conditionFieldLabel?: string;
  /** U událostí — datetime z formuláře (ISO nebo datetime-local). */
  eventDate?: string;
  /** Typ ceny z formuláře — AI se na cenu znovu neptá, pokud je pevná/orientační. */
  priceType?: PriceType;
  /** Lidsky čitelný popisek typu ceny (Pevná cena, Dohodou…). */
  priceTypeLabel?: string;
  /** Částka v Kč z formuláře (u fixed / negotiable). */
  priceAmount?: number;
  /** Všechny nahrané fotky (max. 6) — bezpečnostní filtr. */
  imagesBase64?: string[];
  /** Index hlavní fotky v `imagesBase64` — cross-validace textu s náhledem; hydratace z všech fotek. */
  mainImageIndex?: number;
};

export type ModerationQuestion = {
  id: string;
  /** Otázka ve formuláři (lidsky, s otazníkem). */
  label: string;
  /** Krátký popisek pro sekci Parametry v popisu (bez otazníku). */
  paramLabel?: string;
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
  /** H1: token pro server-side publikaci (vydán po průchodu bezpečnostním filtrem). */
  approvalToken?: string | null;
};

export type ListingModerationInput = {
  intent: ModerationIntent;
  title: string;
  description: string;
  categoryType: CategoryType;
  subcategorySlug: string;
  conditionLabel?: ConditionLabel;
  conditionLabelText?: string;
  conditionFieldLabel?: string;
  eventDate?: string;
  priceType?: PriceType;
  priceTypeLabel?: string;
  priceAmount?: number;
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
  /** H1: token pro server-side publikaci; undefined u skipped (beze změny obsahu). */
  approvalToken?: string;
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
