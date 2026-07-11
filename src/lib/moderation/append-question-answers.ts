import { formatQuestionAnswerAsBullet } from "@/lib/moderation/format-question-answers";
import {
  buildParametersSection,
  joinIntroAndParameters,
  mergeListingParameters,
  MODERATION_QA_SECTION_SEPARATOR,
  parseListingDescription,
  parseParameterLine,
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
      return formatQuestionAnswerAsBullet(question, answer);
    })
    .filter((block): block is string => block !== null);

  if (bullets.length === 0) {
    return safeDescription.trim();
  }

  const parsed = parseListingDescription(safeDescription);
  const newParameters = bullets
    .map((bullet) => parseParameterLine(bullet))
    .filter(
      (item): item is ListingParameter =>
        item !== null && item.label.length > 0 && item.value.length > 0,
    );
  const mergedParameters = mergeListingParameters(
    parsed.parameters,
    newParameters,
  );
  const parameterLines = mergedParameters.map(
    (item) => `• ${item.label}: ${item.value}`,
  );
  const parametersSection = buildParametersSection(parameterLines);

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
