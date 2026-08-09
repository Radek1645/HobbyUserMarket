/**
 * Prefill scaffold `[DOPLNIT …]` — do publikovaného textu nepatří.
 * Uživatel ho má doplnit ve formuláři; při publish (vč. „ponechat původní“) ho odstraníme.
 */

const DOPLNIT_PLACEHOLDER_PATTERN = /\[DOPLNIT[^\]]*\]/gi;

/** Odstraní markery [DOPLNIT …] a uklidí vzniklé mezery / prázdné řádky. */
export function stripDoplnitPlaceholders(text: string): string {
  if (!/\[DOPLNIT/i.test(text)) {
    return text;
  }

  return text
    .replace(DOPLNIT_PLACEHOLDER_PATTERN, " ")
    .replace(/\r\n/g, "\n")
    .replace(/[^\S\n]+/g, " ")
    .replace(/ ?([,;:.])/g, "$1")
    .replace(/([,;:]){2,}/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[,;:\-–—]\s*$/gm, "")
    .trim();
}
