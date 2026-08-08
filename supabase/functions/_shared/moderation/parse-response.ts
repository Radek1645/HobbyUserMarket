import {
  VALID_CATEGORY_TYPES,
  VALID_SUBCATEGORY_SLUGS,
} from "./category-prompts.ts";
import { applyListingPlatformCta } from "./listing-cta.ts";
import { formatEventDateForDisplay } from "./build-user-prompt.ts";

export type ModerationStatus = "APPROVED" | "REJECTED" | "NEEDS_QUESTIONS";

export type ModerationQuestion = {
  id: string;
  label: string;
  paramLabel?: string;
};

/** Drž sync s src/config/moderation/category-fit.ts */
export type CategoryFit = "match" | "better_existing" | "missing_taxonomy";

export type CategorySuggestion = {
  fit: CategoryFit;
  categoryType?: string;
  subcategorySlug?: string;
  hint?: string;
};

/** Hard limit — drž v sync s src/config/moderation/index.ts MODERATION_MAX_QUESTIONS */
const MODERATION_MAX_QUESTIONS = 5;
const CATEGORY_TAXONOMY_HINT_MAX_LENGTH = 120;
const CATEGORY_FIT_VALUES: readonly CategoryFit[] = [
  "match",
  "better_existing",
  "missing_taxonomy",
];

export type ModerationResult = {
  status: ModerationStatus;
  reason?: string;
  rejectedTopicId?: string;
  rejectedImageIndex?: number;
  cleanedTitle?: string;
  metaDescription?: string;
  imageAlt?: string;
  cleanedDescription?: string;
  questions?: ModerationQuestion[];
  /** Interní telemetrie — neposílat klientovi. */
  categorySuggestion?: CategorySuggestion;
};

const MODERATION_RESPONSE_FIELDS = [
  "status",
  "reason",
  "rejectedTopicId",
  "rejectedImageIndex",
  "cleanedTitle",
  "metaDescription",
  "imageAlt",
  "cleanedDescription",
  "questions",
  "categorySuggestion",
] as const;

function parseJsonFromAi(raw: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw.trim()) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("JSON root is not an object");
    }
    const record = parsed as Record<string, unknown>;
    const allowedFields = new Set<string>(MODERATION_RESPONSE_FIELDS);
    if (Object.keys(record).some((field) => !allowedFields.has(field))) {
      throw new Error("JSON contains an unknown field");
    }
    if (
      MODERATION_RESPONSE_FIELDS.some(
        (field) => !Object.prototype.hasOwnProperty.call(record, field),
      )
    ) {
      throw new Error("JSON is missing a required field");
    }
    return record;
  } catch (error) {
    console.error("parseJsonFromAi failed:", error);
    throw new Error("AI nevrátila validní JSON dle požadovaného schématu.");
  }
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

function isValidSuggestedPair(
  categoryType: string,
  subcategorySlug: string,
): boolean {
  if (!(VALID_CATEGORY_TYPES as readonly string[]).includes(categoryType)) {
    return false;
  }
  return Boolean(VALID_SUBCATEGORY_SLUGS[categoryType]?.includes(subcategorySlug));
}

function parseCategorySuggestion(
  value: unknown,
): CategorySuggestion | undefined {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  const fitRaw = asOptionalString(record.fit);
  if (!fitRaw || !(CATEGORY_FIT_VALUES as readonly string[]).includes(fitRaw)) {
    return undefined;
  }
  const fit = fitRaw as CategoryFit;

  let categoryType = asOptionalString(record.categoryType);
  let subcategorySlug = asOptionalString(record.subcategorySlug);
  if (categoryType && subcategorySlug) {
    if (!isValidSuggestedPair(categoryType, subcategorySlug)) {
      categoryType = undefined;
      subcategorySlug = undefined;
    }
  } else {
    categoryType = undefined;
    subcategorySlug = undefined;
  }

  let hint = asOptionalString(record.hint);
  if (hint && hint.length > CATEGORY_TAXONOMY_HINT_MAX_LENGTH) {
    hint = `${hint.slice(0, CATEGORY_TAXONOMY_HINT_MAX_LENGTH - 1)}…`;
  }

  return {
    fit,
    ...(categoryType ? { categoryType } : {}),
    ...(subcategorySlug ? { subcategorySlug } : {}),
    ...(hint ? { hint } : {}),
  };
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

function promoteApprovedIfNoQuestions(
  result: ModerationResult,
  questions: NonNullable<ModerationResult["questions"]>,
): ModerationResult {
  if (questions.length === 0) {
    return {
      ...result,
      status: "APPROVED",
      questions: undefined,
    };
  }

  return { ...result, questions };
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

  return promoteApprovedIfNoQuestions(result, questions);
}

/** Otázka směřuje na datum/čas konání — redundantní, když je eventDate ve formuláři. */
export function isEventDateRelatedQuestion(label: string): boolean {
  const normalized = label.toLowerCase();

  // Bez \b u č/í — JS word boundary je jen ASCII.
  return (
    /datum|termín/.test(normalized) ||
    /čas|hodin/.test(normalized) ||
    /kdy\s+(se\s+)?(koná|probíhá|začíná|start)/.test(normalized) ||
    /den\s+a\s+čas/.test(normalized)
  );
}

/** Odstraní otázky o datu/času, pokud uživatel vyplnil eventDate ve formuláři. */
export function filterRedundantEventDateQuestions(
  result: ModerationResult,
  eventDate?: string,
): ModerationResult {
  if (result.status !== "NEEDS_QUESTIONS" || !result.questions?.length) {
    return result;
  }

  if (!eventDate?.trim()) return result;

  const questions = result.questions.filter(
    (question) => !isEventDateRelatedQuestion(question.label),
  );

  return promoteApprovedIfNoQuestions(result, questions);
}

/**
 * Otázka směřuje na lokalitu / místo — redundantní, když je locationText ve formuláři.
 * Úzká heuristika: nefiltruje obecný „dojezd“ u služeb.
 */
export function isLocationRelatedQuestion(label: string): boolean {
  const normalized = label.toLowerCase();

  // Bez \b u č/ě — JS word boundary je jen ASCII.
  return (
    /lokalit/.test(normalized) ||
    /adres/.test(normalized) ||
    /místo\s+konání/.test(normalized) ||
    /kde\s+(se\s+)?(koná|probíhá|schází|potká|předá)/.test(normalized) ||
    /v\s+jakém\s+(městě|obci|místě)/.test(normalized) ||
    /(město|obec)(?![a-zá-ž])/.test(normalized)
  );
}

/** Odstraní otázky o lokalitě, pokud uživatel vyplnil locationText ve formuláři. */
export function filterRedundantLocationQuestions(
  result: ModerationResult,
  locationText?: string,
): ModerationResult {
  if (result.status !== "NEEDS_QUESTIONS" || !result.questions?.length) {
    return result;
  }

  if (!locationText?.trim()) return result;

  const questions = result.questions.filter(
    (question) => !isLocationRelatedQuestion(question.label),
  );

  return promoteApprovedIfNoQuestions(result, questions);
}

export function parseModerationResponse(
  raw: string,
  imageCount: number,
): ModerationResult {
  const parsed = parseJsonFromAi(raw);
  const status = parsed.status;

  if (
    status !== "APPROVED" &&
    status !== "REJECTED" &&
    status !== "NEEDS_QUESTIONS"
  ) {
    throw new Error("AI vrátila neznámý status moderace.");
  }

  const rejectedImageIndex =
    typeof parsed.rejectedImageIndex === "number" &&
    Number.isInteger(parsed.rejectedImageIndex)
      ? parsed.rejectedImageIndex
      : undefined;

  if (
    rejectedImageIndex != null &&
    (rejectedImageIndex < 0 || rejectedImageIndex >= imageCount)
  ) {
    throw new Error("AI vrátila index fotografie mimo platný rozsah.");
  }

  const reason = asOptionalString(parsed.reason);
  const cleanedTitle = asOptionalString(parsed.cleanedTitle);
  const cleanedDescription = asOptionalString(parsed.cleanedDescription);
  const questions = parseQuestions(parsed.questions);

  if (status === "REJECTED" && !reason) {
    throw new Error("AI zamítnutí neobsahuje důvod.");
  }
  if (status !== "REJECTED" && (!cleanedTitle || !cleanedDescription)) {
    throw new Error("AI schválení neobsahuje povinné publikační texty.");
  }
  if (status === "NEEDS_QUESTIONS" && !questions?.length) {
    throw new Error("AI vyžádala doplnění, ale nevrátila žádné otázky.");
  }

  return {
    status,
    reason,
    rejectedTopicId: asOptionalString(parsed.rejectedTopicId),
    rejectedImageIndex,
    cleanedTitle,
    metaDescription: asOptionalString(parsed.metaDescription),
    imageAlt: asOptionalString(parsed.imageAlt),
    cleanedDescription,
    questions,
    categorySuggestion: parseCategorySuggestion(parsed.categorySuggestion),
  };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const CONTACT_PLACEHOLDER = "[SKRYTO – použij chráněné pole]";

function formatCzkAmount(amount: number): string {
  return amount.toLocaleString("cs-CZ");
}

/** Odstraní zástupný text u ceny, který AI někdy chybně vloží místo chráněného pole formuláře. */
export function sanitizeCleanedDescription(text: string): string {
  let result = text;

  result = result.replace(
    new RegExp(
      `[^.!?\\n]*\\b[Cc]ena\\s*${escapeRegExp(CONTACT_PLACEHOLDER)}[^.!?\\n]*[.!?]?`,
      "g",
    ),
    "",
  );
  result = result.replace(
    new RegExp(
      `\\b[Cc]ena\\s*${escapeRegExp(CONTACT_PLACEHOLDER)}\\s*Kč\\.?`,
      "gi",
    ),
    "",
  );
  result = result.replace(/[ \t]{2,}/g, " ");
  result = result.replace(/\n{3,}/g, "\n\n");

  return result.trim();
}

/** U pevné/orientační ceny z formuláře doplní nebo opraví částku v úvodu. */
export function applyFormPriceToCleanedDescription(
  text: string,
  priceType?: string,
  priceAmount?: number,
): string {
  const hasFormPrice =
    (priceType === "fixed" || priceType === "negotiable") &&
    typeof priceAmount === "number" &&
    !Number.isNaN(priceAmount);

  if (!hasFormPrice) {
    return sanitizeCleanedDescription(text);
  }

  const formatted = formatCzkAmount(priceAmount);
  const formPriceSentence =
    priceType === "fixed"
      ? `Cena ${formatted} Kč.`
      : `Cena ${formatted} Kč, dohodou.`;

  let result = text.replace(
    new RegExp(
      `\\b[Cc]ena\\s*${escapeRegExp(CONTACT_PLACEHOLDER)}\\s*Kč\\.?`,
      "gi",
    ),
    formPriceSentence,
  );

  result = sanitizeCleanedDescription(result);

  // Přepiš „Cena … Kč“ / „Orientační cena … Kč“ na částku z formuláře (i když už nějaké Kč v úvodu jsou).
  result = result.replace(
    /\b(?:[Oo]rientační\s+)?[Cc]ena\s+\d[\d\s]*\s*Kč(?:,\s*dohodou)?\.?/g,
    formPriceSentence,
  );

  const intro = result.split(/\n\n---\n\n/)[0] ?? result;
  const hasPriceInIntro = new RegExp(
    `${escapeRegExp(formatted).replace(/\\ /g, "\\s?")}\\s*Kč`,
  ).test(intro);

  if (!hasPriceInIntro && !/\b\d[\d\s]*\s*Kč/.test(intro)) {
    const parts = result.split(/\n\n---\n\n/);
    const introPart = (parts[0] ?? result).trimEnd();
    const suffix =
      parts.length > 1
        ? `\n\n---\n\n${parts.slice(1).join("\n\n---\n\n")}`
        : "";
    const trimmedIntro = introPart.replace(/\s+$/, "");
    const needsPeriod = trimmedIntro.length > 0 && !/[.!?]$/.test(trimmedIntro);
    const priceSentence = `${needsPeriod ? "." : ""} ${formPriceSentence}`;
    result = `${trimmedIntro}${priceSentence}${suffix}`;
  }

  return result.trim();
}

function formatEventDateParts(iso: string): {
  display: string;
} | null {
  const trimmed = iso.trim();
  if (!trimmed) return null;

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return { display: trimmed };
  }

  return { display: formatEventDateForDisplay(trimmed) };
}

function upsertEventDateParameters(
  parametersBlock: string,
  display: string,
): string {
  const lines = parametersBlock.split("\n");
  const bulletPattern = /^(\s*•\s*)([^:]+):\s*(.*)$/;
  let replacedCombined = false;
  let replacedDatum = false;
  let replacedCas = false;
  const nextLines: string[] = [];

  for (const line of lines) {
    const match = line.match(bulletPattern);
    if (!match) {
      nextLines.push(line);
      continue;
    }

    const [, prefix, rawLabel] = match;
    const label = rawLabel.trim();

    if (/^datum\s+a\s+čas$/i.test(label) || /^termín$/i.test(label)) {
      nextLines.push(`${prefix}${label}: ${display}`);
      replacedCombined = true;
      continue;
    }
    if (/^datum$/i.test(label)) {
      // Prefer one combined bullet — drop separate Datum/Čas when rewriting.
      replacedDatum = true;
      continue;
    }
    if (/^čas$/i.test(label) || /^kdy$/i.test(label)) {
      replacedCas = true;
      continue;
    }

    nextLines.push(line);
  }

  if (replacedCombined) {
    return nextLines.join("\n");
  }

  // Drop leftover empty header-only lines; insert combined bullet after "Parametry".
  const insertIndex = nextLines.findIndex((line) =>
    /^parametry$/i.test(line.trim()),
  );
  const bullet = `• Datum a čas: ${display}`;
  if (insertIndex >= 0) {
    nextLines.splice(insertIndex + 1, 0, bullet);
  } else if (replacedDatum || replacedCas || nextLines.length > 0) {
    nextLines.unshift(bullet);
  } else {
    nextLines.push(bullet);
  }

  return nextLines.join("\n");
}

function insertEventDateSentenceBeforeCta(
  intro: string,
  display: string,
): string {
  const sentence = `Koná se ${display}.`;
  const ctaPattern =
    /Pro více informací napište \S+ zprávu přes (?:platformu|web)\.?/i;
  const ctaMatch = intro.match(ctaPattern);

  if (ctaMatch && ctaMatch.index != null) {
    const before = intro.slice(0, ctaMatch.index).trimEnd();
    const after = intro.slice(ctaMatch.index);
    const needsSpace = before.length > 0 && !/\s$/.test(before);
    const needsPeriod = before.length > 0 && !/[.!?]$/.test(before);
    return `${before}${needsPeriod ? "." : ""}${needsSpace || needsPeriod ? " " : ""}${sentence} ${after}`.replace(
      /\s{2,}/g,
      " ",
    );
  }

  const trimmed = intro.trimEnd();
  const needsPeriod = trimmed.length > 0 && !/[.!?]$/.test(trimmed);
  return `${trimmed}${needsPeriod ? "." : ""} ${sentence}`.trim();
}

/** Doplní / opraví datum a čas konání z formuláře v Parametrech (a v úvodu, pokud chybí). */
export function applyFormEventDateToCleanedDescription(
  text: string,
  eventDate?: string,
): string {
  const parts = formatEventDateParts(eventDate ?? "");
  if (!parts) return text;

  const { display } = parts;
  const sections = text.split(/\n\n---\n\n/);
  let intro = sections[0] ?? text;
  let parameters =
    sections.length > 1 ? sections.slice(1).join("\n\n---\n\n") : "";

  if (parameters.trim()) {
    parameters = upsertEventDateParameters(parameters, display);
  } else {
    parameters = `Parametry\n• Datum a čas: ${display}`;
  }

  if (!intro.includes(display)) {
    intro = insertEventDateSentenceBeforeCta(intro, display);
  }

  return `${intro.trim()}\n\n---\n\n${parameters.trim()}`.trim();
}

/** Jednoduchý strip kontaktů + SPZ — záloha, když AI něco propustí. */
export function stripContactInfo(text: string): string {
  const CONTACT_PLACEHOLDER = "[SKRYTO – použij chráněné pole]";
  const PLATE_PLACEHOLDER = "[SKRYTO]";
  const EMAIL_PATTERN =
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const PHONE_PATTERN =
    /(?:\+420[\s.-]?)?(?:[67]\d{2}|[2-5]\d{2})[\s.-]?\d{3}[\s.-]?\d{3}\b/g;
  const CZ_LICENSE_PLATE_MODERN_PATTERN = /\b\d[A-Z]{2}\s?\d{4}\b/gi;
  const CZ_LICENSE_PLATE_ALT_PATTERN =
    /\b[A-Z]{1,2}\s?\d{1,2}[-\s]\d{2,4}\b/g;
  const PRICE_PHRASE_PATTERN =
    /\b((?:[Cc]ena|[Oo]rientační cena|[Mm]zda|[Vv]stupné)\s+\d[\d\s]{0,15}\d\s*Kč\.?)/g;
  const PRICE_TOKEN_PREFIX = "\uE000PRICE";

  const saved: string[] = [];
  const masked = text.replace(PRICE_PHRASE_PATTERN, (match) => {
    const token = `${PRICE_TOKEN_PREFIX}${saved.length}\uE000`;
    saved.push(match);
    return token;
  });

  const stripped = masked
    .replace(EMAIL_PATTERN, CONTACT_PLACEHOLDER)
    .replace(PHONE_PATTERN, CONTACT_PLACEHOLDER)
    .replace(CZ_LICENSE_PLATE_MODERN_PATTERN, PLATE_PLACEHOLDER)
    .replace(CZ_LICENSE_PLATE_ALT_PATTERN, PLATE_PLACEHOLDER);

  return stripped.replace(
    new RegExp(`${PRICE_TOKEN_PREFIX}(\\d+)\uE000`, "g"),
    (_, index) => saved[Number(index)] ?? "",
  );
}

/** Hard cap — sync s src/config/listing-seo.ts */
const LISTING_META_DESCRIPTION_MAX_LENGTH = 160;
const LISTING_IMAGE_ALT_MAX_LENGTH = 125;

const META_DESCRIPTION_CTA_HINTS = [
  /pro více informací/i,
  /podívejte se na detaily/i,
  /kontaktujte prodejce/i,
  /napište prodejci/i,
  /napište zadavateli/i,
  /napište poskytovateli/i,
  /napište pořadateli/i,
  /napište inzerentovi/i,
  /detaily a kontakt na (?:platformě|webu)/i,
];

function softClampText(text: string, maxLength: number): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  if (trimmed.length <= maxLength) return trimmed;

  const slice = trimmed.slice(0, maxLength);
  const sentenceEnd = Math.max(
    slice.lastIndexOf(". "),
    slice.lastIndexOf("! "),
    slice.lastIndexOf("? "),
    slice.lastIndexOf("."),
    slice.lastIndexOf("!"),
    slice.lastIndexOf("?"),
  );

  if (sentenceEnd >= Math.floor(maxLength * 0.6)) {
    return slice.slice(0, sentenceEnd + 1).trimEnd();
  }

  const space = slice.lastIndexOf(" ");
  if (space >= Math.floor(maxLength * 0.6)) {
    return slice.slice(0, space).trimEnd();
  }

  return slice.trimEnd();
}

function splitIntoSentences(text: string): string[] {
  const matches = text.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g);
  if (!matches) return [text];
  return matches.map((part) => part.trim()).filter(Boolean);
}

function isMetaCtaSentence(sentence: string): boolean {
  return META_DESCRIPTION_CTA_HINTS.some((hint) => hint.test(sentence));
}

function dropTrailingMetaCtaSentences(text: string): string {
  const sentences = splitIntoSentences(text.trim());
  if (sentences.length <= 1) return text.trim();

  while (
    sentences.length > 1 &&
    isMetaCtaSentence(sentences[sentences.length - 1]!)
  ) {
    sentences.pop();
  }

  return sentences.join(" ").replace(/\s+/g, " ").trim();
}

function clampMetaDescription(text: string | undefined): string | undefined {
  if (!text?.trim()) return undefined;
  const trimmed = text.trim();
  if (trimmed.length <= LISTING_META_DESCRIPTION_MAX_LENGTH) {
    return trimmed;
  }
  const withoutCta = dropTrailingMetaCtaSentences(trimmed);
  const clamped =
    withoutCta.length <= LISTING_META_DESCRIPTION_MAX_LENGTH
      ? withoutCta
      : softClampText(withoutCta, LISTING_META_DESCRIPTION_MAX_LENGTH);
  return clamped || undefined;
}

function clampImageAlt(text: string | undefined): string | undefined {
  if (!text?.trim()) return undefined;
  const clamped = softClampText(text, LISTING_IMAGE_ALT_MAX_LENGTH);
  return clamped || undefined;
}

export function normalizeModerationResult(
  result: ModerationResult,
  fallbackTitle: string,
  fallbackDescription: string,
  priceType?: string,
  priceAmount?: number,
  categoryType?: string,
  eventDate?: string,
): ModerationResult {
  if (result.status === "REJECTED") {
    return {
      status: "REJECTED",
      reason:
        result.reason ??
        "Inzerát porušuje pravidla webu. Upravte obsah a zkuste to znovu.",
      rejectedTopicId: result.rejectedTopicId,
      rejectedImageIndex: result.rejectedImageIndex,
      categorySuggestion: result.categorySuggestion,
    };
  }

  const cleanedTitle = (result.cleanedTitle ?? fallbackTitle).trim();
  const cleanedDescription = applyListingPlatformCta(
    applyFormEventDateToCleanedDescription(
      applyFormPriceToCleanedDescription(
        stripContactInfo(
          (result.cleanedDescription ?? fallbackDescription).trim(),
        ),
        priceType,
        priceAmount,
      ),
      eventDate,
    ),
    categoryType,
  );
  const metaDescription = clampMetaDescription(result.metaDescription);
  const imageAlt = clampImageAlt(result.imageAlt);

  if (result.status === "NEEDS_QUESTIONS") {
    return {
      status: "NEEDS_QUESTIONS",
      cleanedTitle,
      cleanedDescription,
      metaDescription,
      imageAlt,
      questions: result.questions,
      categorySuggestion: result.categorySuggestion,
    };
  }

  return {
    status: "APPROVED",
    cleanedTitle,
    cleanedDescription,
    metaDescription,
    imageAlt,
    categorySuggestion: result.categorySuggestion,
  };
}
