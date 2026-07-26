import {
  LISTING_QUALITY_INTRO_GOOD_MIN_CHARS,
  LISTING_QUALITY_NO_PHOTO_SCORE_CAP,
  LISTING_QUALITY_POINTS,
  LISTING_QUALITY_UI,
  getListingQualityBand,
  type ListingQualityBand,
  type ListingQualityTipCode,
} from "@/config/listing-quality";
import {
  isPlaceholderParameterValue,
  parseListingDescription,
} from "@/lib/moderation/parse-listing-description";

export type ListingQualityScoreInput = {
  imageCount: number;
  description: string;
  questions: ReadonlyArray<{ id: string }>;
  questionAnswers: Record<string, string>;
};

export type ListingQualityScoreResult = {
  score: number;
  band: ListingQualityBand;
  tipCode: ListingQualityTipCode | null;
  tip: string | null;
  /** Tip vede na sekci doplňujících otázek. */
  tipScrollsToImprove: boolean;
};

function countAnsweredQuestions(
  questions: ReadonlyArray<{ id: string }>,
  questionAnswers: Record<string, string>,
): { total: number; answered: number } {
  const total = questions.length;
  if (total === 0) return { total: 0, answered: 0 };

  let answered = 0;
  for (const question of questions) {
    if ((questionAnswers[question.id] ?? "").trim()) {
      answered += 1;
    }
  }
  return { total, answered };
}

type DescriptionScoreBreakdown = {
  points: number;
  introLength: number;
  paramCount: number;
  introComplete: boolean;
  paramsComplete: boolean;
};

function scoreDescription(description: string): DescriptionScoreBreakdown {
  const parsed = parseListingDescription(description);
  const introLength = parsed.intro.trim().length;
  const realParams = parsed.parameters.filter(
    (param) => param.label && !isPlaceholderParameterValue(param.value),
  );
  const paramCount = realParams.length;

  let points = 0;
  const introMax = Math.round(LISTING_QUALITY_POINTS.description * 0.6);
  const paramsMax = LISTING_QUALITY_POINTS.description - introMax;
  const introComplete = introLength >= LISTING_QUALITY_INTRO_GOOD_MIN_CHARS;
  const paramsComplete = paramCount >= 3;

  if (introComplete) {
    points += introMax;
  } else if (introLength > 0) {
    points += Math.round(
      (introLength / LISTING_QUALITY_INTRO_GOOD_MIN_CHARS) * introMax,
    );
  }

  if (paramsComplete) {
    points += paramsMax;
  } else if (paramCount > 0) {
    points += Math.round((paramCount / 3) * paramsMax);
  }

  return {
    points,
    introLength,
    paramCount,
    introComplete,
    paramsComplete,
  };
}

function scoreQuestions(
  questions: ReadonlyArray<{ id: string }>,
  questionAnswers: Record<string, string>,
): number {
  const { total, answered } = countAnsweredQuestions(questions, questionAnswers);
  if (total === 0) return LISTING_QUALITY_POINTS.questions;
  return Math.round((answered / total) * LISTING_QUALITY_POINTS.questions);
}

function resolveTipCode(input: {
  imageCount: number;
  unansweredCount: number;
  score: number;
  description: DescriptionScoreBreakdown;
}): ListingQualityTipCode | null {
  if (input.imageCount <= 0) return "missing_photo";
  if (input.unansweredCount > 0) {
    if (input.score >= 70) return "can_improve";
    return "needs_answers";
  }
  if (!input.description.introComplete) return "needs_longer_intro";
  if (!input.description.paramsComplete) return "needs_params";
  if (input.score >= 100) return "perfect";
  return "needs_info";
}

/**
 * Deterministické skóre kvality inzerátu (0–100) + jeden tip.
 * Nejde o predikci prodeje — jen úplnost a připravenost textu.
 * SEO (meta/alt) skóre neovlivňuje — připravuje AI.
 */
export function computeListingQualityScore(
  input: ListingQualityScoreInput,
): ListingQualityScoreResult {
  const imageCount = Math.max(0, input.imageCount);
  const { total: questionTotal, answered } = countAnsweredQuestions(
    input.questions,
    input.questionAnswers,
  );
  const unansweredCount = questionTotal - answered;
  const description = scoreDescription(input.description);

  let raw =
    (imageCount > 0 ? LISTING_QUALITY_POINTS.photos : 0) +
    description.points +
    scoreQuestions(input.questions, input.questionAnswers);

  if (imageCount <= 0) {
    raw = Math.min(raw, LISTING_QUALITY_NO_PHOTO_SCORE_CAP);
  }

  const score = Math.max(0, Math.min(100, Math.round(raw)));
  const band = getListingQualityBand(score);
  const tipCode = resolveTipCode({
    imageCount,
    unansweredCount,
    score,
    description,
  });
  const tip = tipCode ? LISTING_QUALITY_UI.tips[tipCode] : null;
  const tipScrollsToImprove =
    tipCode === "needs_answers" ||
    tipCode === "can_improve" ||
    (tipCode === "needs_info" && unansweredCount > 0);

  return {
    score,
    band,
    tipCode,
    tip,
    tipScrollsToImprove,
  };
}
