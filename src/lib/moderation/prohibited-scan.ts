import { PROHIBITED_TOPICS } from "@/config/moderation/prohibited-topics";

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

const KEYWORDS: readonly string[] = PROHIBITED_TOPICS.flatMap(
  (topic) => topic.keywords ?? [],
).map(normalize);

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
