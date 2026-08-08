const MAX_QUESTIONS = 5;

const GOODS_CATEGORY_TYPES_FOR_QUESTIONS = [
  "auto",
  "detsky",
  "dum",
  "elektro",
  "moda",
  "sport",
  "hobby",
  "ostatni",
] as const;

function isGoodsCategoryType(categoryType: string): boolean {
  return (GOODS_CATEGORY_TYPES_FOR_QUESTIONS as readonly string[]).includes(
    categoryType,
  );
}

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

/** Typické EU dětské velikosti oblečení (cm výšky / pásmo). */
const KIDS_CLOTHING_SIZE_PATTERN =
  String.raw`(?:56|62|68|74|80|86|92|98|104|110|116|122|128|134|140|146|152|158|164)`;

const SHOES_PRODUCT_PATTERN =
  /\b(?:bot[ay]?|boty|obuv|tenisk\w*|sand[aá]l\w*|kozačk\w*|polobot\w*|bačkor\w*)\b/iu;

function normalizeQuestionKey(question: ModerationQuestion): string {
  return (question.paramLabel ?? question.label)
    .trim()
    .toLocaleLowerCase("cs");
}

/**
 * Stejné téma = jedna otázka. AI často přidá „doporučený věk u hračky“
 * vedle povinné „Věk / výška“ — bez topic key by obě prošly.
 */
function isChildAgeHeightQuestion(question: ModerationQuestion): boolean {
  const text = `${question.paramLabel ?? ""} ${question.label}`
    .trim()
    .toLocaleLowerCase("cs");
  if (!text) return false;
  if (/v[eě]k\s*\/\s*v[yý]šk/.test(text)) return true;
  if (/\bdoporučen\w*.{0,40}\bv[eě]k\b/.test(text)) return true;
  if (/\bv[eě]k\b.{0,50}(?:d[ií]t|hračk|mimink|batol)/.test(text)) return true;
  if (/(?:d[ií]t|hračk|mimink|batol).{0,50}\bv[eě]k\b/.test(text)) return true;
  if (/\bv[yý]šk\w*.{0,30}(?:d[ií]t|d[eě]tsk)/.test(text)) return true;
  if (/(?:pro\s+jak[ýé]\s+v[eě]k|vhodn\w*.{0,20}v[eě]k)/.test(text)) {
    return true;
  }
  return false;
}

function questionDedupeKey(question: ModerationQuestion): string {
  if (isChildAgeHeightQuestion(question)) {
    return "topic:child-age-height";
  }
  return normalizeQuestionKey(question);
}

function dedupeQuestions(
  questions: ModerationQuestion[],
): ModerationQuestion[] {
  const merged: ModerationQuestion[] = [];
  const seen = new Set<string>();
  for (const question of questions) {
    const key = questionDedupeKey(question);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    merged.push(question);
  }
  return merged;
}

/** Zjevně dětské zboží — ne „dětský styl“ pro dospělé bez těchto slov. */
function isChildrensProduct(text: string): boolean {
  return /\b(?:d[eě]tsk\w*|d[ií]vč[ií]\w*|chlapeck\w*|pro\s+d[ií]t[eě])\b/iu.test(
    text,
  );
}

function isShoesProduct(text: string): boolean {
  return SHOES_PRODUCT_PATTERN.test(text);
}

/** Věk, výška nebo EU dětská velikost už v textu — otázku Věk/výška nepřidávat. */
function hasChildAgeOrHeightAnswer(text: string): boolean {
  return (
    /\d+\s*(?:[-–]\s*\d+\s*)?let\b/iu.test(text) ||
    /\bv[eě]k\b/iu.test(text) ||
    /(?:v[yý]šk\w*|vysok\w*).{0,20}\d+(?:[.,]\d+)?\s*cm\b/iu.test(text) ||
    /\d+(?:[.,]\d+)?\s*cm.{0,20}(?:v[yý]šk\w*|vysok\w*)/iu.test(text) ||
    new RegExp(
      `(?:vel(?:ikost)?\\.?\\s*|vel\\.?\\s+)${KIDS_CLOTHING_SIZE_PATTERN}\\b`,
      "iu",
    ).test(text) ||
    new RegExp(
      `\\b${KIDS_CLOTHING_SIZE_PATTERN}\\s*(?:cm\\b|(?:[-–/]\\s*)?vel)`,
      "iu",
    ).test(text)
  );
}

function hasChildShoeSizeOrInsole(text: string): boolean {
  return (
    hasMillimeterMeasurement(text, String.raw`d[eé]lk[ay]\s+st[eé]lk[ay]`) ||
    new RegExp(
      `(?:vel(?:ikost)?\\.?\\s*|EU\\s*|č\\.?\\s*)${KIDS_CLOTHING_SIZE_PATTERN}\\b`,
      "iu",
    ).test(text) ||
    /(?:vel(?:ikost)?\.?\s*|EU\s*|č\.?\s*)\d{2}\b/iu.test(text)
  );
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

function hasSportEquipmentAnswer(text: string): boolean {
  return (
    /(?:výbav|vybaven[ií]|s\s+sebou|vlastn[ií]\s+vybav)/iu.test(text) ||
    /(?:nic|žádn\w*|nen[ií]\s+třeba|není\s+potřeba).{0,40}(?:s\s+sebou|výbav|vybaven)/iu.test(
      text,
    ) ||
    /(?:přilb|helma|chránič|tretr|kopačk|sálovk|raket|lyž|brusl|neopren|spacák|karimat|stan\b|hole\b|dres|rukavic)/iu.test(
      text,
    )
  );
}

/** Konkrétní výbava vozu/motorky už v textu nebo v AI Parametrech. */
function hasVehicleEquipmentAnswer(text: string): boolean {
  return (
    /(?:výbav|vybaven)/iu.test(text) ||
    /(?:klimatizac|\bklima\b|navigac|tempomat|parkovač|parkovac[ií]|parkovací|senzor|xenon|matrix|carplay|android\s*auto|apple\s*car|vyhřívan|kožen|\bkůže\b|tažné|střešní|panoramat|multimedi|infotainment|bluetooth|hands[\s-]?free|asistent|zpětn[aá]\s+kamera|airbag|\besp\b|\babs\b|alufelg|lit[aá]\s+kol|zimn[ií]\s+pneu|letn[ií]\s+pneu|sada\s+kol|kufr(?:y|ík)?\b|padac[ií]\s+r[aá]m|plexi|vyhřívan[eé]\s+rukojet)/iu.test(
      text,
    )
  );
}

function resolveVehicleEquipmentQuestions(
  context: RequiredCategoryQuestionContext,
  text: string,
): ModerationQuestion[] {
  if (context.categoryType !== "auto") {
    return [];
  }
  if (
    context.subcategorySlug !== "osobni-auta" &&
    context.subcategorySlug !== "motorky"
  ) {
    return [];
  }
  if (hasVehicleEquipmentAnswer(text)) {
    return [];
  }

  const isMotorcycle = context.subcategorySlug === "motorky";
  return [
    {
      id: "required-vehicle-equipment",
      label: isMotorcycle
        ? "Jaká je výbava motorky?"
        : "Jaká je výbava vozu?",
      paramLabel: "Výbava",
    },
  ];
}

function resolveSportEventQuestions(
  context: RequiredCategoryQuestionContext,
  text: string,
): ModerationQuestion[] {
  if (
    context.categoryType !== "udalost" ||
    context.subcategorySlug !== "sport"
  ) {
    return [];
  }

  if (hasSportEquipmentAnswer(text)) {
    return [];
  }

  return [
    {
      id: "required-sport-equipment",
      label:
        "Potřebují účastníci nějakou výbavu nebo speciální vybavení s sebou?",
      paramLabel: "Výbava / vybavení",
    },
  ];
}

function resolveFashionQuestions(text: string): ModerationQuestion[] {
  const questions: ModerationQuestion[] = [];
  const isShoes = isShoesProduct(text);
  const isChildrens = isChildrensProduct(text);

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
 * U zjevně dětského zboží bez věku/výšky/vel. pásma — 1 nepovinná otázka.
 * U dětských bot se stélkou/velikostí se neptá znovu.
 */
function resolveChildrensAgeHeightQuestions(
  text: string,
  categoryType: string,
): ModerationQuestion[] {
  const treatAsKids =
    categoryType === "detsky" || isChildrensProduct(text);
  if (!treatAsKids) return [];
  if (hasChildAgeOrHeightAnswer(text)) return [];
  if (isShoesProduct(text) && hasChildShoeSizeOrInsole(text)) return [];

  return [
    {
      id: "required-child-age-height",
      label: "Pro jaký věk / výšku dítěte je věc vhodná?",
      paramLabel: "Věk / výška",
    },
  ];
}

function resolveGoodsRequiredQuestions(
  categoryType: string,
  text: string,
): ModerationQuestion[] {
  return [
    ...resolveFashionQuestions(text),
    ...resolveChildrensAgeHeightQuestions(text, categoryType),
  ];
}

/**
 * Doplní relevantní volitelné otázky, jejichž zobrazení nemá záviset jen na AI.
 * Odpovědi zůstávají nepovinné a do Parametrů se přidají pouze po vyplnění.
 */
export function ensureRequiredCategoryQuestions<T extends ModerationResultLike>(
  result: T,
  context: RequiredCategoryQuestionContext,
): T {
  if (result.status === "REJECTED") {
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

  const requiredQuestions = isGoodsCategoryType(context.categoryType)
    ? [
        ...resolveGoodsRequiredQuestions(context.categoryType, searchableText),
        ...resolveVehicleEquipmentQuestions(context, searchableText),
      ]
    : resolveSportEventQuestions(context, searchableText);

  const aiQuestions = result.questions ?? [];
  if (requiredQuestions.length === 0 && aiQuestions.length === 0) {
    return result;
  }

  // Required first — při kolizi tématu (věk) zůstane kanonická „Věk / výška“.
  const merged = dedupeQuestions([...requiredQuestions, ...aiQuestions]);
  if (merged.length === 0) {
    return result;
  }

  return {
    ...result,
    status: "NEEDS_QUESTIONS",
    questions: merged.slice(0, MAX_QUESTIONS),
  };
}
