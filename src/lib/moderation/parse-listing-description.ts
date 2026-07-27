/** Oddělovač mezi úvodem a parametry (viz parseListingDescription). */
export const MODERATION_QA_SECTION_SEPARATOR = "\n\n---\n\n";

/** Nadpis sekce parametrů v uloženém popisu (musí sedět s AI promptem). */
export const LISTING_PARAMETERS_HEADING = "Parametry";

const PARAMETERS_HEADING_PATTERN = /^(Parametry|Technické údaje)$/i;

/** Odrážka parametru: • / - / * / – / — */
const PARAMETER_BULLET_PATTERN = /^(?:[•\-*]|[–—])\s+(.*)$/;

/** Řádek nebo label jen z pomlček — oddělovač úvod/Parametry, ne parametr. */
const STRUCTURAL_SEPARATOR_PATTERN = /^-{2,}$/;

export type ListingParameter = {
  label: string;
  value: string;
};

function normalizeParameterLabel(label: string): string {
  return label.trim().toLocaleLowerCase("cs");
}

function isStructuralSeparatorLine(line: string): boolean {
  return STRUCTURAL_SEPARATOR_PATTERN.test(line.trim());
}

/** Odstraní trailing oddělovač / nadpis Parametry z úvodu po špatném splitu. */
function stripTrailingSeparators(intro: string): string {
  let result = intro;
  for (let i = 0; i < 3; i += 1) {
    const next = result
      .replace(/(?:\r?\n|[ \t])*-{3,}[ \t]*$/g, "")
      .replace(/(?:\r?\n|[ \t])*(?:Parametry|Technické údaje)[ \t]*$/gi, "")
      .replace(/(?:\r?\n|[ \t])*[•\-*–—][ \t]*$/g, "");
    if (next === result) break;
    result = next;
  }
  return result.trimEnd();
}

/** Vyšší = čistší úvod (bez uniklého nadpisu / oddělovače). */
function introSplitQuality(intro: string): number {
  let score = 0;
  if (!/(?:^|\r?\n)[ \t]*(?:Parametry|Technické údaje)[ \t]*(?:\r?\n|$)/i.test(intro)) {
    score += 2;
  }
  if (!/(?:^|\r?\n)[ \t]*-{3,}[ \t]*(?:\r?\n|$)/m.test(intro)) {
    score += 1;
  }
  return score;
}

/** Před pomlčkami už je nadpis Parametry → další --- je šum v bloku parametrů. */
function hasParametersHeadingBefore(description: string, index: number): boolean {
  const before = description.slice(0, index);
  return /(?:^|\r?\n)[ \t]*(?:Parametry|Technické údaje)[ \t]*(?:\r?\n|$)/i.test(
    before,
  );
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

type SplitCandidate = {
  /** Konec úvodu (exkluzivně). */
  introEnd: number;
  /** Začátek bloku parametrů (inkl. nadpis Parametry, pokud tam je). */
  paramsStart: number;
};

/**
 * Kandidáti na oddělení úvodu od Parametrů.
 * Pokrývá kanonický i typické AI odchylky (inline ---, jeden newline, jen nadpis…).
 * Žádný obsahově specifický text — jen struktura.
 */
function collectSplitCandidates(description: string): SplitCandidate[] {
  const candidates: SplitCandidate[] = [];

  function pushUnique(introEnd: number, paramsStart: number) {
    if (introEnd < 0 || paramsStart < introEnd || paramsStart > description.length) {
      return;
    }
    if (
      candidates.some(
        (item) => item.introEnd === introEnd && item.paramsStart === paramsStart,
      )
    ) {
      return;
    }
    candidates.push({ introEnd, paramsStart });
  }

  // Kanonický i inline oddělovač, např. „…web. --- Parametry\n• Stav: …“.
  // paramsStart nechává nadpis parseru; tím se vyhneme problémům s greedy \s*.
  for (const match of description.matchAll(/-{3,}/g)) {
    if (match.index === undefined) continue;

    const separatorStart = match.index;
    const separatorEnd = separatorStart + match[0].length;
    if (hasParametersHeadingBefore(description, separatorStart)) continue;

    const lineStart =
      description.lastIndexOf("\n", Math.max(0, separatorStart - 1)) + 1;
    const beforeOnLine = description.slice(lineStart, separatorStart);
    if (/^[ \t]*[•\-*–—][ \t]*$/.test(beforeOnLine)) continue;

    const afterSeparator = description.slice(separatorEnd);
    const startsParametersBlock =
      /^\s*(?:(?:Parametry|Technické údaje)[ \t]*(?:\r?\n|$)\s*)?(?:[•\-*–—][ \t]+|$)/i.test(
        afterSeparator,
      );
    if (!startsParametersBlock) continue;

    pushUnique(separatorStart, separatorEnd);
  }

  // 4) Jen nadpis Parametry (bez ---)
  for (const match of description.matchAll(
    /\r?\n[ \t]*(Parametry|Technické údaje)[ \t]*\r?\n/gi,
  )) {
    if (match.index === undefined) continue;
    pushUnique(match.index, match.index);
  }

  return candidates;
}

export function parseParameterLine(line: string): ListingParameter | null {
  const trimmed = line.trim();
  if (!trimmed || PARAMETERS_HEADING_PATTERN.test(trimmed)) return null;
  if (isStructuralSeparatorLine(trimmed)) return null;

  const bulletMatch = PARAMETER_BULLET_PATTERN.exec(trimmed);
  if (bulletMatch) {
    const content = bulletMatch[1] ?? "";
    const colonMatch = /:\s*/.exec(content);
    if (colonMatch && colonMatch.index !== undefined) {
      const label = content.slice(0, colonMatch.index).trim();
      if (!label || isStructuralSeparatorLine(label)) return null;
      return {
        label,
        value: content.slice(colonMatch.index + colonMatch[0].length).trim(),
      };
    }

    const spaceValueMatch = /^(.+?)\s+(\d[\d\s]*(?:\s*m²|\s*m2)?)$/i.exec(content);
    if (spaceValueMatch) {
      const label = spaceValueMatch[1]!.trim();
      if (!label || isStructuralSeparatorLine(label)) return null;
      return {
        label,
        value: spaceValueMatch[2]!.trim(),
      };
    }

    if (!content || isStructuralSeparatorLine(content)) return null;
    return { label: content, value: "" };
  }

  const newlineIndex = trimmed.indexOf("\n");
  if (newlineIndex === -1) {
    return { label: trimmed, value: "" };
  }

  const label = trimmed.slice(0, newlineIndex).trim();
  if (!label || isStructuralSeparatorLine(label)) return null;

  return {
    label,
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

function countRealParameters(parameters: ListingParameter[]): number {
  return parameters.filter(
    (param) => param.label && !isPlaceholderParameterValue(param.value),
  ).length;
}

/**
 * Rozparsuje popis na úvodní text a sekci parametrů.
 * Z více možných oddělení vybere to s nejvíce platnými Parametry (obecné, ne na jeden inzerát).
 */
export function parseListingDescription(description: string): ParsedListingDescription {
  const fallback: ParsedListingDescription = {
    intro: description.trim(),
    parametersHeading: LISTING_PARAMETERS_HEADING,
    parameters: [],
  };

  let best = fallback;
  let bestCount = 0;

  for (const candidate of collectSplitCandidates(description)) {
    const intro = description.slice(0, candidate.introEnd).trim();
    const paramsSection = description.slice(candidate.paramsStart).trim();
    if (!paramsSection) continue;

    const { heading, parameters } = parseParametersBlock(paramsSection);
    const realCount = countRealParameters(parameters);
    if (realCount === 0) continue;

    // Více parametrů vyhrává; při remíze čistší úvod, pak delší úvod.
    const quality = introSplitQuality(intro);
    const bestQuality = introSplitQuality(best.intro);
    const better =
      realCount > bestCount ||
      (realCount === bestCount && quality > bestQuality) ||
      (realCount === bestCount &&
        quality === bestQuality &&
        intro.length > best.intro.length);
    if (!better) continue;

    bestCount = realCount;
    best = {
      intro: stripTrailingSeparators(intro) || best.intro,
      parametersHeading: heading,
      parameters,
    };
  }

  return {
    ...best,
    intro: stripTrailingSeparators(best.intro),
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

/**
 * Sjednotí popis na kanonické odřádkování (úvod, prázdný řádek, ---, Parametry, odrážky).
 * AI často nechá „…web. --- Parametry“ na jednom řádku — v textarea to pak jen zalamuje šířkou.
 */
export function normalizeListingDescriptionStructure(description: string): string {
  const trimmed = description.trim();
  if (!trimmed) return trimmed;

  const parsed = parseListingDescription(trimmed);
  if (parsed.parameters.length === 0) return trimmed;

  const bullets = parsed.parameters.map((param) =>
    param.value ? `• ${param.label}: ${param.value}` : `• ${param.label}`,
  );
  const parametersSection = buildParametersSection(
    bullets,
    parsed.parametersHeading || LISTING_PARAMETERS_HEADING,
  );
  return joinIntroAndParameters(parsed.intro, parametersSection);
}
