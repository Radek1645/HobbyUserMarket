import {
  LISTING_DESCRIPTION_MAX_LENGTH,
  MODERATION_DESCRIPTION_QA_RESERVE,
} from "./constants.ts";

/** Pravidla délky popisu pro system prompt AI moderace. */
export function buildDescriptionLengthPromptRules(): string {
  const needsQuestionsMax =
    LISTING_DESCRIPTION_MAX_LENGTH - MODERATION_DESCRIPTION_QA_RESERVE;

  return `- cleanedDescription (úvod + „---“ + Parametry + odrážky) MUSÍ mít nejvýše ${LISTING_DESCRIPTION_MAX_LENGTH} znaků včetně mezer a odřádkování — delší text platforma odmítne.
- U statusu NEEDS_QUESTIONS: cleanedDescription max ${needsQuestionsMax} znaků — odpovědi z dotazníku se automaticky doplní do Parametrů a celý publikovaný popis smí mít jen ${LISTING_DESCRIPTION_MAX_LENGTH} znaků.
- Překročí-li by text limit, zkrát úvod, slouč výbavu do jedné odrážky a vynech méně důležité detaily — nikdy neukončuj uprostřed věty.`;
}
