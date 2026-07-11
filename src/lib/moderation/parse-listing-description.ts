/** Oddělovač mezi úvodem a parametry (viz parseListingDescription). */
export const MODERATION_QA_SECTION_SEPARATOR = "\n\n---\n\n";

/** Nadpis sekce parametrů v uloženém popisu (musí sedět s AI promptem). */
export const LISTING_PARAMETERS_HEADING = "Parametry";

const QA_SECTION_SEPARATOR_PATTERN = /\r?\n\r?\n---\r?\n\r?\n/;

const PARAMETERS_HEADING_PATTERN = /^(Parametry|Technické údaje)$/i;

const INLINE_PARAMETERS_PATTERN =
  /\r?\n\r?\n(Parametry|Technické údaje)\r?\n/i;

export type ListingParameter = {
  label: string;
  value: string;
};

function normalizeParameterLabel(label: string): string {
  return label.trim().toLocaleLowerCase("cs");
}

/** Placeholder bez skutečné hodnoty — AI je nemá nechat v Parametrech u NEEDS_QUESTIONS. */
export function isPlaceholderParameterValue(value: string): boolean {
  const trimmed = value.trim();
  return (
    trimmed === "…" ||
    trimmed === "..." ||
    trimmed === ".." ||
    trimmed === "–" ||
    trimmed === "—" ||
    trimmed === "-" ||
    trimmed === "?" ||
    trimmed === "???" ||
    trimmed.toLocaleLowerCase("cs") === "neuvedeno"
  );
}

/** Sloučí existující parametry s odpověďmi z dotazníku — stejný label se nepřidává dvakrát. */
export function mergeListingParameters(
  existing: ListingParameter[],
  additions: ListingParameter[],
): ListingParameter[] {
  const additionMap = new Map<string, ListingParameter>();
  for (const item of additions) {
    additionMap.set(normalizeParameterLabel(item.label), item);
  }

  const merged: ListingParameter[] = [];
  const seen = new Set<string>();

  for (const item of existing) {
    const key = normalizeParameterLabel(item.label);
    if (seen.has(key)) continue;

    const replacement = additionMap.get(key);
    if (replacement) {
      merged.push(replacement);
      additionMap.delete(key);
      seen.add(key);
      continue;
    }

    if (isPlaceholderParameterValue(item.value)) continue;

    merged.push(item);
    seen.add(key);
  }

  for (const item of additionMap.values()) {
    merged.push(item);
  }

  return merged;
}

export type ParsedListingDescription = {
  intro: string;
  parametersHeading: string;
  parameters: ListingParameter[];
};

function findQaSectionMarker(description: string): {
  index: number;
  length: number;
} | null {
  const match = QA_SECTION_SEPARATOR_PATTERN.exec(description);
  if (!match || match.index === undefined) return null;
  return { index: match.index, length: match[0].length };
}

export function parseParameterLine(line: string): ListingParameter | null {
  const trimmed = line.trim();
  if (!trimmed || PARAMETERS_HEADING_PATTERN.test(trimmed)) return null;

  if (trimmed.startsWith("• ")) {
    const content = trimmed.slice(2);
    const colonIndex = content.indexOf(": ");
    if (colonIndex >= 0) {
      return {
        label: content.slice(0, colonIndex).trim(),
        value: content.slice(colonIndex + 2).trim(),
      };
    }

    const spaceValueMatch = /^(.+?)\s+(\d[\d\s]*(?:\s*m²|\s*m2)?)$/i.exec(content);
    if (spaceValueMatch) {
      return {
        label: spaceValueMatch[1]!.trim(),
        value: spaceValueMatch[2]!.trim(),
      };
    }

    return { label: content, value: "" };
  }

  const newlineIndex = trimmed.indexOf("\n");
  if (newlineIndex === -1) {
    return { label: trimmed, value: "" };
  }

  return {
    label: trimmed.slice(0, newlineIndex).trim(),
    value: trimmed.slice(newlineIndex + 1).trim(),
  };
}

function parseParametersBlock(section: string): {
  heading: string;
  parameters: ListingParameter[];
} {
  const lines = section.split(/\n+/).map((line) => line.trim());
  let heading = LISTING_PARAMETERS_HEADING;
  const paramLines: string[] = [];

  for (const line of lines) {
    if (!line) continue;
    if (PARAMETERS_HEADING_PATTERN.test(line)) {
      heading = line;
      continue;
    }
    paramLines.push(line);
  }

  const parameters = paramLines
    .map(parseParameterLine)
    .filter((item): item is ListingParameter => item !== null && item.label.length > 0);

  return { heading, parameters };
}

/** Rozparsuje popis na úvodní text a sekci parametrů. */
export function parseListingDescription(description: string): ParsedListingDescription {
  const marker = findQaSectionMarker(description);

  if (marker) {
    const intro = description.slice(0, marker.index).trim();
    const paramsSection = description.slice(marker.index + marker.length).trim();

    if (!paramsSection) {
      return {
        intro: description.trim(),
        parametersHeading: LISTING_PARAMETERS_HEADING,
        parameters: [],
      };
    }

    const { heading, parameters } = parseParametersBlock(paramsSection);
    return { intro, parametersHeading: heading, parameters };
  }

  const inlineMatch = INLINE_PARAMETERS_PATTERN.exec(description);
  if (inlineMatch && inlineMatch.index !== undefined) {
    const intro = description.slice(0, inlineMatch.index).trim();
    const paramsSection = description.slice(inlineMatch.index).trim();
    const { heading, parameters } = parseParametersBlock(paramsSection);
    return { intro, parametersHeading: heading, parameters };
  }

  return {
    intro: description.trim(),
    parametersHeading: LISTING_PARAMETERS_HEADING,
    parameters: [],
  };
}

/** Sestaví blok parametrů pro uložení do DB. */
export function buildParametersSection(
  bullets: string[],
  heading: string = LISTING_PARAMETERS_HEADING,
): string {
  if (bullets.length === 0) return "";
  return `${heading}\n${bullets.join("\n")}`;
}

/** Celý strukturovaný popis: úvod + --- + Parametry. */
export function joinIntroAndParameters(
  intro: string,
  parametersSection: string,
): string {
  const trimmedIntro = intro.trim();
  const trimmedParams = parametersSection.trim();

  if (!trimmedParams) return trimmedIntro;
  if (!trimmedIntro) return trimmedParams;

  return `${trimmedIntro}${MODERATION_QA_SECTION_SEPARATOR}${trimmedParams}`.trim();
}
