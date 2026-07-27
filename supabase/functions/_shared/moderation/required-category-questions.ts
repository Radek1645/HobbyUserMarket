const MAX_QUESTIONS = 5;

type ModerationQuestion = {
  id: string;
  label: string;
  paramLabel?: string;
};

type ModerationResultLike = {
  status: "APPROVED" | "REJECTED" | "NEEDS_QUESTIONS";
  cleanedTitle?: string;
  cleanedDescription?: string;
  questions?: ModerationQuestion[];
  [key: string]: unknown;
};

export type RequiredCategoryQuestionContext = {
  categoryType: string;
  subcategorySlug: string;
  sourceTitle: string;
  sourceDescription: string;
};

const MILLIMETER_VALUE_PATTERN =
  String.raw`\d+(?:[.,]\d+)?(?:\s*[/+x×-]\s*\d+(?:[.,]\d+)?)?\s*mm\b`;

function normalizeQuestionKey(question: ModerationQuestion): string {
  return (question.paramLabel ?? question.label)
    .trim()
    .toLocaleLowerCase("cs");
}

function hasMillimeterMeasurement(
  text: string,
  dimensionPattern: string,
  subjectPattern?: string,
): boolean {
  const subjectBefore = subjectPattern
    ? `${subjectPattern}.{0,35}${dimensionPattern}`
    : dimensionPattern;
  const dimensionBefore = subjectPattern
    ? `${dimensionPattern}.{0,35}${subjectPattern}`
    : dimensionPattern;

  return new RegExp(
    `(?:${subjectBefore}|${dimensionBefore}).{0,35}${MILLIMETER_VALUE_PATTERN}`,
    "iu",
  ).test(text);
}

function hasRemovableInsoleAnswer(text: string): boolean {
  return (
    /(?:vynd[aá]vac[ií]|vyj[ií]mateln[aá]|odn[ií]mateln[aá]).{0,25}(?:st[eé]lk|vložk)/iu.test(
      text,
    ) ||
    /(?:st[eé]lk|vložk).{0,25}(?:vynd[aá]vac[ií]|vyj[ií]mateln[aá]|odn[ií]mateln[aá])/iu.test(
      text,
    ) ||
    /(?:vynd[aá]vac[ií]\s+)?(?:st[eé]lka|vložka)\s*:\s*(?:ano|ne)\b/iu.test(
      text,
    )
  );
}

function resolveFashionQuestions(text: string): ModerationQuestion[] {
  const questions: ModerationQuestion[] = [];
  const isShoes =
    /\b(?:bot[ay]?|boty|obuv|tenisk\w*|sand[aá]l\w*|kozačk\w*|polobot\w*|bačkor\w*)\b/iu.test(
      text,
    );
  const isChildrens =
    /\b(?:d[eě]tsk\w*|d[ií]vč[ií]\w*|chlapeck\w*|pro\s+d[ií]t[eě])\b/iu.test(
      text,
    );

  if (isShoes && !hasRemovableInsoleAnswer(text)) {
    questions.push({
      id: "required-removable-insole",
      label: "Mají boty vyndávací stélku / vložku?",
      paramLabel: "Vyndávací stélka",
    });
  }

  if (
    isShoes &&
    isChildrens &&
    !hasMillimeterMeasurement(text, String.raw`d[eé]lk[ay]\s+st[eé]lk[ay]`)
  ) {
    questions.push({
      id: "required-insole-length-mm",
      label: "Jaká je délka stélky v mm?",
      paramLabel: "Délka stélky",
    });
  }

  const isWatch = /\b(?:hodink\w*|smartwatch\w*)\b/iu.test(text);
  const strapPattern = String.raw`(?:p[aá]sk\w*|řem[ií]nk\w*)`;

  if (
    isWatch &&
    !hasMillimeterMeasurement(text, String.raw`šířk[ay]`, strapPattern)
  ) {
    questions.push({
      id: "required-watch-strap-width-mm",
      label: "Jaká je šířka pásku v mm?",
      paramLabel: "Šířka pásku",
    });
  }

  const isBraceletOrNecklace =
    /\b(?:n[aá]ram(?:ek|k)\w*|n[aá]hrdeln[ií]k\w*)\b/iu.test(text);
  if (
    !isWatch &&
    isBraceletOrNecklace &&
    !hasMillimeterMeasurement(text, String.raw`d[eé]lk[ay]`)
  ) {
    questions.push({
      id: "required-jewelry-length-mm",
      label: "Jaká je délka náramku / náhrdelníku v mm?",
      paramLabel: "Délka",
    });
  }

  return questions;
}

/**
 * Doplní relevantní volitelné otázky, jejichž zobrazení nemá záviset jen na AI.
 * Odpovědi zůstávají nepovinné a do Parametrů se přidají pouze po vyplnění.
 */
export function ensureRequiredCategoryQuestions<T extends ModerationResultLike>(
  result: T,
  context: RequiredCategoryQuestionContext,
): T {
  if (
    result.status === "REJECTED" ||
    context.categoryType !== "zbozi"
  ) {
    return result;
  }

  const searchableText = [
    context.sourceTitle,
    context.sourceDescription,
    result.cleanedTitle,
    result.cleanedDescription,
  ]
    .filter((value): value is string => typeof value === "string")
    .join("\n");
  const requiredQuestions = resolveFashionQuestions(searchableText);
  if (requiredQuestions.length === 0) return result;

  const merged: ModerationQuestion[] = [];
  const seen = new Set<string>();
  for (const question of [...requiredQuestions, ...(result.questions ?? [])]) {
    const key = normalizeQuestionKey(question);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    merged.push(question);
  }

  return {
    ...result,
    status: "NEEDS_QUESTIONS",
    questions: merged.slice(0, MAX_QUESTIONS),
  };
}
