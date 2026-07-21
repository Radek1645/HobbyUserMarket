import { HARD_HIT_CATEGORIES } from "./hard-hit-terms.ts";
import { PROHIBITED_TOPICS } from "./prohibited-topics.ts";

/**
 * Levný server-side scan zakázaných klíčových slov (H1 — mitigace textového
 * rezidua: text lze po AI schválení editovat). NENAHRAZUJE AI filtr — jen
 * chytá zjevné případy před publikací. Plné AI re-moderování upraveného textu
 * je mimo rozsah (běží klient→Edge kvůli timeoutu, PRD §3).
 */

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Silnější normalizace pro hard-hit — maže mezery/interpunkci používanou k obcházení. */
function normalizeHardHit(text: string): string {
  return normalize(text).replace(/[\s._\-*/\\|]+/g, "");
}

const KEYWORDS: readonly string[] = PROHIBITED_TOPICS.flatMap(
  (topic) => topic.keywords ?? [],
).map(normalize);

type HardHitEntry = { categoryId: string; termNormalized: string };

const HARD_HIT_ENTRIES: readonly HardHitEntry[] = HARD_HIT_CATEGORIES.flatMap(
  (category) =>
    category.terms.map((term) => ({
      categoryId: category.id,
      termNormalized: normalizeHardHit(term),
    })),
);

/** Vrátí nalezené klíčové slovo, nebo null když je text čistý. */
export function findProhibitedKeyword(
  title: string,
  description: string,
): string | null {
  const haystack = normalize(`${title}\n${description}`);
  for (const keyword of KEYWORDS) {
    if (keyword && haystack.includes(keyword)) {
      return keyword;
    }
  }
  return null;
}

/**
 * Hard-hit pre-filter před Gemini — CSAM a těžce zakázané fráze.
 * Jiný důsledek než findProhibitedKeyword (evidence + žádné AI).
 */
export function checkHardHitText(text: string): {
  rejected: boolean;
  matchedCategory?: string;
  matchedTerm?: string;
} {
  const haystack = normalizeHardHit(text);
  if (!haystack) {
    return { rejected: false };
  }

  for (const entry of HARD_HIT_ENTRIES) {
    if (entry.termNormalized && haystack.includes(entry.termNormalized)) {
      return {
        rejected: true,
        matchedCategory: entry.categoryId,
        matchedTerm: entry.termNormalized,
      };
    }
  }

  return { rejected: false };
}
