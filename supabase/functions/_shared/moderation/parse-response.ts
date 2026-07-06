export type ModerationStatus = "APPROVED" | "REJECTED" | "NEEDS_QUESTIONS";

export type ModerationQuestion = {
  id: string;
  label: string;
  paramLabel?: string;
};

/** Hard limit — drž v sync s src/config/moderation/index.ts MODERATION_MAX_QUESTIONS */
const MODERATION_MAX_QUESTIONS = 5;

export type ModerationResult = {
  status: ModerationStatus;
  reason?: string;
  rejectedTopicId?: string;
  rejectedImageIndex?: number;
  cleanedTitle?: string;
  cleanedDescription?: string;
  questions?: ModerationQuestion[];
};

function extractJsonObject(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("{")) {
    return trimmed;
  }

  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch?.[1]) {
    return fenceMatch[1].trim();
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return trimmed.slice(start, end + 1);
  }

  throw new Error("AI nevrátila validní JSON.");
}

function asOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseQuestions(value: unknown): ModerationQuestion[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const questions = value
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const label = asOptionalString(record.label);
      if (!label) return null;
      const id = asOptionalString(record.id) ?? `q${index + 1}`;
      const paramLabel = asOptionalString(record.paramLabel);
      return paramLabel ? { id, label, paramLabel } : { id, label };
    })
    .filter((item): item is ModerationQuestion => item !== null);

  if (questions.length === 0) return undefined;

  return questions.slice(0, MODERATION_MAX_QUESTIONS);
}

/** Otázka směřuje na cenu — redundantní, když už je ve formuláři. */
export function isPriceRelatedQuestion(label: string): boolean {
  const normalized = label.toLowerCase();

  return (
    /\b(cen[auyě]|cenu)\b/.test(normalized) ||
    /představa\s+o\s+cen/.test(normalized) ||
    /kolik\s+(chceš|chcete|požaduje|stojí)/.test(normalized) ||
    /jaká\s+je\s+(vaše\s+)?(cena|představa)/.test(normalized)
  );
}

/** Odstraní otázky o ceně, pokud uživatel vyplnil pevnou/orientační cenu ve formuláři. */
export function filterRedundantPriceQuestions(
  result: ModerationResult,
  priceType?: string,
  priceAmount?: number,
): ModerationResult {
  if (result.status !== "NEEDS_QUESTIONS" || !result.questions?.length) {
    return result;
  }

  const hasFormPrice =
    (priceType === "fixed" || priceType === "negotiable") &&
    typeof priceAmount === "number" &&
    !Number.isNaN(priceAmount);

  if (!hasFormPrice) return result;

  const questions = result.questions.filter(
    (question) => !isPriceRelatedQuestion(question.label),
  );

  if (questions.length === 0) {
    return {
      ...result,
      status: "APPROVED",
      questions: undefined,
    };
  }

  return { ...result, questions };
}

export function parseModerationResponse(raw: string): ModerationResult {
  const parsed = JSON.parse(extractJsonObject(raw)) as Record<string, unknown>;
  const status = parsed.status;

  if (
    status !== "APPROVED" &&
    status !== "REJECTED" &&
    status !== "NEEDS_QUESTIONS"
  ) {
    throw new Error("AI vrátila neznámý status moderace.");
  }

  const rejectedImageIndex =
    typeof parsed.rejectedImageIndex === "number"
      ? parsed.rejectedImageIndex
      : undefined;

  return {
    status,
    reason: asOptionalString(parsed.reason),
    rejectedTopicId: asOptionalString(parsed.rejectedTopicId),
    rejectedImageIndex,
    cleanedTitle: asOptionalString(parsed.cleanedTitle),
    cleanedDescription: asOptionalString(parsed.cleanedDescription),
    questions: parseQuestions(parsed.questions),
  };
}

/** Jednoduchý strip kontaktů — záloha, když AI něco propustí. */
export function stripContactInfo(text: string): string {
  return text
    .replace(
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      "[SKRYTO – použij chráněné pole]",
    )
    .replace(
      /(\+420\s?)?(\d[\d\s]{7,12}\d)/g,
      "[SKRYTO – použij chráněné pole]",
    );
}

export function normalizeModerationResult(
  result: ModerationResult,
  fallbackTitle: string,
  fallbackDescription: string,
): ModerationResult {
  if (result.status === "REJECTED") {
    return {
      status: "REJECTED",
      reason:
        result.reason ??
        "Inzerát porušuje pravidla platformy. Uprav obsah a zkus to znovu.",
      rejectedTopicId: result.rejectedTopicId,
      rejectedImageIndex: result.rejectedImageIndex,
    };
  }

  const cleanedTitle = (result.cleanedTitle ?? fallbackTitle).trim();
  const cleanedDescription = stripContactInfo(
    (result.cleanedDescription ?? fallbackDescription).trim(),
  );

  if (result.status === "NEEDS_QUESTIONS") {
    return {
      status: "NEEDS_QUESTIONS",
      cleanedTitle,
      cleanedDescription,
      questions: result.questions,
    };
  }

  return {
    status: "APPROVED",
    cleanedTitle,
    cleanedDescription,
  };
}
