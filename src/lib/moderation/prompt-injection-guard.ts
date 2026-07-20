import type { ModerateListingResponse } from "@/lib/moderation/types";

type ModerationResult = Pick<
  ModerateListingResponse,
  | "status"
  | "reason"
  | "cleanedTitle"
  | "cleanedDescription"
  | "metaDescription"
  | "imageAlt"
  | "questions"
>;

const INJECTION_PATTERNS: readonly RegExp[] = [
  /ignoruj\s+(předchozí|všechna|systemová|tvá|tvoje)\s+(pravidl|instrukc)/iu,
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|rules)/i,
  /(?:vr[aá]t|return|output|respond\s+with).{0,48}\bAPPROVED\b/i,
  /"status"\s*:\s*"APPROVED"/i,
  /<\/?system>/i,
  /nov[ýy]\s+(system\s+)?prompt/i,
  /jste\s+(nyní|teď)\s+(moderátor|asistent)/iu,
  /forget\s+(all\s+)?(previous|prior)\s+(instructions|rules)/i,
];

export const PROMPT_INJECTION_REJECTION_REASON =
  "Text inzerátu obsahuje neplatný obsah. Upravte název nebo popis a zkuste to znovu.";

export const PROHIBITED_OUTPUT_REJECTION_REASON =
  "Navržený text porušuje pravidla platformy. Upravte obsah a zkuste to znovu.";

export function containsPromptInjection(text: string): boolean {
  const normalized = text.trim();
  if (!normalized) return false;

  return INJECTION_PATTERNS.some((pattern) => pattern.test(normalized));
}

type ProhibitedKeywordFinder = (
  title: string,
  description: string,
) => string | null;

/** Post-parse pojistka — AI výstup nesmí obejít pravidla (M10). */
export function applyPostModerationSafetyChecks(
  result: ModerationResult,
  source: { title: string; description: string },
  findProhibitedKeyword: ProhibitedKeywordFinder,
): ModerationResult {
  if (result.status === "REJECTED") {
    return result;
  }

  const sourceBlob = `${source.title}\n${source.description}`;
  if (containsPromptInjection(sourceBlob)) {
    return {
      status: "REJECTED",
      reason: PROMPT_INJECTION_REJECTION_REASON,
    };
  }

  const cleanedTitle = (result.cleanedTitle ?? source.title).trim();
  const cleanedDescription = (result.cleanedDescription ?? source.description).trim();
  const metaDescription = (result.metaDescription ?? "").trim();
  const imageAlt = (result.imageAlt ?? "").trim();
  const outputBlob = [cleanedTitle, cleanedDescription, metaDescription, imageAlt]
    .filter(Boolean)
    .join("\n");

  if (findProhibitedKeyword(cleanedTitle, cleanedDescription)) {
    return {
      status: "REJECTED",
      reason: PROHIBITED_OUTPUT_REJECTION_REASON,
    };
  }

  if (containsPromptInjection(outputBlob)) {
    return {
      status: "REJECTED",
      reason: PROMPT_INJECTION_REJECTION_REASON,
    };
  }

  return result;
}
