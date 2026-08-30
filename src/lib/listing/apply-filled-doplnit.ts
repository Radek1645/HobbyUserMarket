import {
  collectFilledDoplnitAnswers,
  foldDoplnitFieldKey,
  publishDoplnitLabel,
  questionMatchesFilledDoplnit,
  stripDoplnitPlaceholders,
  type DoplnitPromptEntry,
} from "@/lib/listing/doplnit-prompts";
import {
  buildParametersSection,
  joinIntroAndParameters,
  mergeListingParameters,
  normalizeListingDescriptionStructure,
  parseListingDescription,
  type ListingParameter,
} from "@/lib/moderation/parse-listing-description";
import type { ModerationQuestion } from "@/lib/moderation/types";

function parameterMatchesDoplnitField(
  paramLabel: string,
  entry: DoplnitPromptEntry,
): boolean {
  const paramKey = foldDoplnitFieldKey(paramLabel);
  const fieldKey = foldDoplnitFieldKey(entry.field);
  const publishedKey = foldDoplnitFieldKey(publishDoplnitLabel(entry.field));

  return (
    paramKey === fieldKey ||
    paramKey === publishedKey ||
    paramKey.startsWith(`${fieldKey} `) ||
    paramKey.startsWith(`${publishedKey} `)
  );
}

function mergeFilledIntoParameters(
  existing: ListingParameter[],
  filled: DoplnitPromptEntry[],
): ListingParameter[] {
  const remaining = [...existing];
  const additions: ListingParameter[] = [];

  for (const entry of filled) {
    const label = publishDoplnitLabel(entry.field);
    const matchIndex = remaining.findIndex((param) =>
      parameterMatchesDoplnitField(param.label, entry),
    );
    if (matchIndex >= 0) {
      remaining[matchIndex] = { label, value: entry.value };
      continue;
    }
    additions.push({ label, value: entry.value });
  }

  return mergeListingParameters(remaining, additions);
}

function injectFilledDoplnitIntoDescription(
  description: string,
  filled: DoplnitPromptEntry[],
): string {
  const stripped = stripDoplnitPlaceholders(description);
  const parsed = parseListingDescription(stripped);
  const merged = mergeFilledIntoParameters(parsed.parameters, filled);
  const bullets = merged.map((param) =>
    param.value ? `• ${param.label}: ${param.value}` : `• ${param.label}`,
  );
  const parametersSection = buildParametersSection(
    bullets,
    parsed.parametersHeading,
  );
  const intro = parsed.parameters.length > 0 ? parsed.intro : stripped;
  const joined = joinIntroAndParameters(intro, parametersSection);
  return normalizeListingDescriptionStructure(joined);
}

/**
 * Vyplněné „Doplňte X: hodnota“ jsou fakta — doplní se do Parametrů
 * a stejné otázky hydratace se zahodí (AI je často položí znovu a hodnotu zahodí).
 */
export function applyFilledDoplnitToHydration(input: {
  sourceDescription: string;
  cleanedDescription: string;
  questions?: ModerationQuestion[];
}): {
  cleanedDescription: string;
  questions: ModerationQuestion[] | undefined;
} {
  const filled = collectFilledDoplnitAnswers(input.sourceDescription);
  if (filled.length === 0) {
    return {
      cleanedDescription: input.cleanedDescription,
      questions: input.questions,
    };
  }

  const cleanedDescription = injectFilledDoplnitIntoDescription(
    input.cleanedDescription,
    filled,
  );
  const remaining = (input.questions ?? []).filter(
    (question) =>
      !filled.some((entry) => questionMatchesFilledDoplnit(question, entry)),
  );

  return {
    cleanedDescription,
    questions: remaining.length > 0 ? remaining : undefined,
  };
}
