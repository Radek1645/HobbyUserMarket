import {
  DOPLNIT_FIELD_MAX_LENGTH,
  DOPLNIT_PROMPT_VERB,
  DOPLNIT_PUBLISH_LABELS,
} from "@/config/doplnit-prompts";

const DOPLNIT_BRACKET_LINE_PATTERN =
  /^\s*\[DOPLNIT\s*([^\]]+)\]\s*(.*?)\s*$/i;
const DOPLNIT_PROMPT_LINE_PATTERN =
  /^\s*Dopl(?:ň|n)te\s+([^:\n]+):\s*(.*?)\s*$/i;

function dopInitBracketGlobal(): RegExp {
  return /\[DOPLNIT\s*([^\]]+)\]/gi;
}

export type DoplnitPromptEntry = {
  field: string;
  value: string;
};

/** ASCII-folded klíč pro mapování značku/znacka → stejný label. */
export function foldDoplnitFieldKey(raw: string): string {
  return raw
    .trim()
    .toLocaleLowerCase("cs")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ");
}

function isUsableFieldName(field: string): boolean {
  const trimmed = field.trim();
  return trimmed.length > 0 && trimmed.length <= DOPLNIT_FIELD_MAX_LENGTH;
}

function parsePromptLine(line: string): DoplnitPromptEntry | null {
  const promptMatch = line.match(DOPLNIT_PROMPT_LINE_PATTERN);
  if (promptMatch) {
    const field = promptMatch[1]?.trim() ?? "";
    if (!isUsableFieldName(field)) return null;
    return { field, value: promptMatch[2]?.trim() ?? "" };
  }

  const bracketMatch = line.match(DOPLNIT_BRACKET_LINE_PATTERN);
  if (bracketMatch) {
    const field = bracketMatch[1]?.replace(/\s+/g, " ").trim() ?? "";
    if (!isUsableFieldName(field)) return null;
    return { field, value: bracketMatch[2]?.trim() ?? "" };
  }

  return null;
}

function publishLabel(field: string): string {
  const key = foldDoplnitFieldKey(field);
  const mapped = DOPLNIT_PUBLISH_LABELS[key];
  if (mapped) return mapped;
  const trimmed = field.trim();
  if (!trimmed) return "Údaj";
  return trimmed.charAt(0).toLocaleUpperCase("cs") + trimmed.slice(1);
}

/** Řádek ve formuláři: prázdný končí mezerou za dvojtečkou. */
export function toDoplnitPromptLine(field: string, value = ""): string {
  const name = field.replace(/\s+/g, " ").trim();
  const answer = value.trim();
  return answer
    ? `${DOPLNIT_PROMPT_VERB} ${name}: ${answer}`
    : `${DOPLNIT_PROMPT_VERB} ${name}: `;
}

function collectPromptEntries(description: string): {
  prose: string;
  entries: DoplnitPromptEntry[];
} {
  const seen = new Map<string, DoplnitPromptEntry>();
  const order: string[] = [];

  function addEntry(entry: DoplnitPromptEntry) {
    const key = foldDoplnitFieldKey(entry.field);
    if (!key) return;
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, entry);
      order.push(key);
      return;
    }
    if (!existing.value && entry.value) {
      seen.set(key, { field: existing.field, value: entry.value });
    }
  }

  const lines = description.replace(/\r\n/g, "\n").split("\n");
  const keptLines: string[] = [];
  for (const line of lines) {
    const parsed = parsePromptLine(line);
    if (parsed) {
      addEntry(parsed);
      continue;
    }
    keptLines.push(line);
  }

  let prose = keptLines.join("\n");
  const inlineMatches = [...prose.matchAll(dopInitBracketGlobal())];
  for (const match of inlineMatches) {
    const field = match[1]?.replace(/\s+/g, " ").trim() ?? "";
    if (isUsableFieldName(field)) {
      addEntry({ field, value: "" });
    }
  }

  prose = prose.replace(dopInitBracketGlobal(), " ");
  prose = prose
    .replace(
      /\b(součástí je|soucasti je|obsahuje|včetně|vcetne)\s*[:–-]?\s*$/gim,
      "",
    )
    .replace(/[^\S\n]+/g, " ")
    .replace(/ ?([,;:.])/g, "$1")
    .replace(/([,;:]){2,}/g, "$1")
    .replace(/\(\s*\)/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .replace(/[,;:\-–—]\s*$/g, "")
    .trim();

  const entries = order
    .map((key) => seen.get(key))
    .filter((entry): entry is DoplnitPromptEntry => Boolean(entry));

  return { prose, entries };
}

function tidyResolvedText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[^\S\n]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function hasDoplnitScaffold(text: string): boolean {
  return (
    /\[DOPLNIT/i.test(text) || /^\s*Dopl(?:ň|n)te\s+[^:\n]+:/im.test(text)
  );
}

/**
 * Vytáhne výzvy z textu a dá je pod nabídku jako „Doplňte značku: “.
 * Funguje pro [DOPLNIT …] i už převedené řádky; vyplněnou hodnotu ponechá.
 */
export function formatDoplnitPlaceholders(description: string): string {
  if (!hasDoplnitScaffold(description)) {
    return description.trim();
  }

  const { prose, entries } = collectPromptEntries(description);
  if (entries.length === 0) {
    return prose || description.trim();
  }

  const promptLines = entries.map((entry) =>
    toDoplnitPromptLine(entry.field, entry.value),
  );

  if (!prose) {
    return promptLines.join("\n");
  }

  return `${prose}\n\n${promptLines.join("\n")}`;
}

/**
 * Při publish: prázdné výzvy pryč, vyplněné „Doplňte značku: Nike“ → „Značka: Nike“.
 * Starý token [DOPLNIT …] bere stejně (vč. textu za ním na stejném řádku).
 */
export function stripDoplnitPlaceholders(text: string): string {
  if (!hasDoplnitScaffold(text)) {
    return text;
  }

  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];

  for (const line of lines) {
    const parsed = parsePromptLine(line);
    if (parsed) {
      if (!parsed.value) continue;
      out.push(`${publishLabel(parsed.field)}: ${parsed.value}`);
      continue;
    }

    if (!/\[DOPLNIT/i.test(line)) {
      out.push(line);
      continue;
    }

    const leftover = line
      .replace(dopInitBracketGlobal(), " ")
      .replace(/[^\S\n]+/g, " ")
      .trim();
    if (leftover) {
      out.push(leftover);
    }
  }

  return tidyResolvedText(out.join("\n"));
}
