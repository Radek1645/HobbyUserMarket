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
  metaDescription?: string;
  imageAlt?: string;
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

function normalizeJsonQuotes(input: string): string {
  return input
    .replace(/\u201C|\u201D/g, '"')
    .replace(/\u2018|\u2019/g, "'");
}

/** Odstraní trailing commas před ] nebo } — častá chyba Gemini JSON. */
function stripTrailingCommas(input: string): string {
  let prev = "";
  let current = input;
  while (prev !== current) {
    prev = current;
    current = current.replace(/,(\s*[}\]])/g, "$1");
  }
  return current;
}

/** Escapuje neescapované řádky/taby uvnitř JSON stringů. */
function escapeControlCharsInJsonStrings(json: string): string {
  let result = "";
  let inString = false;
  let escaped = false;

  for (let i = 0; i < json.length; i++) {
    const ch = json[i]!;
    if (!inString) {
      result += ch;
      if (ch === '"') inString = true;
      escaped = false;
      continue;
    }
    if (escaped) {
      result += ch;
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      result += ch;
      escaped = true;
      continue;
    }
    if (ch === '"') {
      result += ch;
      inString = false;
      continue;
    }
    if (ch === "\n") {
      result += "\\n";
      continue;
    }
    if (ch === "\r") {
      result += "\\r";
      continue;
    }
    if (ch === "\t") {
      result += "\\t";
      continue;
    }
    result += ch;
  }

  return result;
}

function parseJsonFromAi(raw: string): Record<string, unknown> {
  const extracted = extractJsonObject(raw);
  const candidates = [
    extracted,
    stripTrailingCommas(extracted),
    stripTrailingCommas(escapeControlCharsInJsonStrings(extracted)),
    stripTrailingCommas(
      escapeControlCharsInJsonStrings(normalizeJsonQuotes(extracted)),
    ),
  ];

  let lastError: unknown;
  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate) as Record<string, unknown>;
    } catch (error) {
      lastError = error;
    }
  }

  console.error(
    "parseJsonFromAi failed:",
    lastError,
    extracted.slice(0, 800),
  );
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
    typeof parsed.rejectedImageIndex === "number"
      ? parsed.rejectedImageIndex
      : undefined;

  return {
    status,
    reason: asOptionalString(parsed.reason),
    rejectedTopicId: asOptionalString(parsed.rejectedTopicId),
    rejectedImageIndex,
    cleanedTitle: asOptionalString(parsed.cleanedTitle),
    metaDescription: asOptionalString(parsed.metaDescription),
    imageAlt: asOptionalString(parsed.imageAlt),
    cleanedDescription: asOptionalString(parsed.cleanedDescription),
    questions: parseQuestions(parsed.questions),
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
  let result = text.replace(
    new RegExp(
      `\\b[Cc]ena\\s*${escapeRegExp(CONTACT_PLACEHOLDER)}\\s*Kč\\.?`,
      "gi",
    ),
    `Cena ${formatted} Kč.`,
  );

  result = sanitizeCleanedDescription(result);

  const intro = result.split(/\n\n---\n\n/)[0] ?? result;
  const hasPriceInIntro = new RegExp(
    `${escapeRegExp(formatted).replace(/\\ /g, "\\s?")}\\s*Kč`,
  ).test(intro);

  if (!hasPriceInIntro && !/\b\d[\d\s]*\s*Kč/.test(intro)) {
    const parts = result.split(/\n\n---\n\n/);
    const introPart = (parts[0] ?? result).trimEnd();
    const suffix = parts.length > 1 ? `\n\n---\n\n${parts.slice(1).join("\n\n---\n\n")}` : "";
    const trimmedIntro = introPart.replace(/\s+$/, "");
    const needsPeriod = trimmedIntro.length > 0 && !/[.!?]$/.test(trimmedIntro);
    const priceSentence =
      priceType === "fixed"
        ? `${needsPeriod ? "." : ""} Cena ${formatted} Kč.`
        : `${needsPeriod ? "." : ""} Cena ${formatted} Kč, dohodou.`;
    result = `${trimmedIntro}${priceSentence}${suffix}`;
  }

  return result.trim();
}

/** Jednoduchý strip kontaktů — záloha, když AI něco propustí. */
export function stripContactInfo(text: string): string {
  const CONTACT_PLACEHOLDER = "[SKRYTO – použij chráněné pole]";
  const EMAIL_PATTERN =
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const PHONE_PATTERN =
    /(?:\+420[\s.-]?)?(?:[67]\d{2}|[2-5]\d{2})[\s.-]?\d{3}[\s.-]?\d{3}\b/g;
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
    .replace(PHONE_PATTERN, CONTACT_PLACEHOLDER);

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
  /detaily a kontakt na platformě/i,
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
): ModerationResult {
  if (result.status === "REJECTED") {
    return {
      status: "REJECTED",
      reason:
        result.reason ??
        "Inzerát porušuje pravidla platformy. Upravte obsah a zkuste to znovu.",
      rejectedTopicId: result.rejectedTopicId,
      rejectedImageIndex: result.rejectedImageIndex,
    };
  }

  const cleanedTitle = (result.cleanedTitle ?? fallbackTitle).trim();
  const cleanedDescription = applyFormPriceToCleanedDescription(
    stripContactInfo((result.cleanedDescription ?? fallbackDescription).trim()),
    priceType,
    priceAmount,
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
    };
  }

  return {
    status: "APPROVED",
    cleanedTitle,
    cleanedDescription,
    metaDescription,
    imageAlt,
  };
}
