import { formatQuestionAnswerAsBullet } from "@/lib/moderation/format-question-answers";
import {
  buildParametersSection,
  joinIntroAndParameters,
  MODERATION_QA_SECTION_SEPARATOR,
  parseListingDescription,
  type ListingParameter,
} from "@/lib/moderation/parse-listing-description";
import type { ModerationQuestion } from "@/lib/moderation/types";

export { MODERATION_QA_SECTION_SEPARATOR };

/** Sloučí odpovědi z dotazníku do popisu — sekce Parametry s odrážkami. */
export function appendQuestionAnswersToDescription(
  description: string | null | undefined,
  questions: ModerationQuestion[],
  answers: Record<string, string>,
): string {
  const safeDescription = description ?? "";

  const bullets = questions
    .map((question) => {
      const answer = answers[question.id]?.trim();
      if (!answer) return null;
      return formatQuestionAnswerAsBullet(question.label, answer);
    })
    .filter((block): block is string => block !== null);

  if (bullets.length === 0) {
    return safeDescription.trim();
  }

  const parsed = parseListingDescription(safeDescription);
  const existingLines = parsed.parameters.map(
    (item) => `• ${item.label}: ${item.value}`,
  );
  const parametersSection = buildParametersSection([
    ...existingLines,
    ...bullets,
  ]);

  return joinIntroAndParameters(parsed.intro, parametersSection);
}

/** @deprecated Prefer parseListingDescription */
export function splitDescriptionWithQuestionAnswers(description: string): {
  main: string;
  questionBlocks: { question: string; answer: string }[];
} {
  const parsed = parseListingDescription(description);

  return {
    main: parsed.intro,
    questionBlocks: parsed.parameters.map((item) => ({
      question: item.label,
      answer: item.value,
    })),
  };
}

export type { ListingParameter };
