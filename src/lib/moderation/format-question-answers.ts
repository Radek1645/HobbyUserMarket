import {
  formatCzkAmount,
  parsePriceInput,
} from "@/lib/posts/price-input";

const QUESTION_SHORT_LABELS: [RegExp, string][] = [
  [/rok\s+výroby/i, "Rok výroby"],
  [/najeto|kilometr|nájezd/i, "Nájezd"],
  [/motorizace|typ\s+paliva|palivo/i, "Motorizace"],
  [/technick[ouá]\s+kontrol|\bstk\b/i, "STK platná do"],
  [/představa\s+o\s+cen|jaká\s+je.*cen/i, "Cena"],
  [/kde\s+přesně|lokalit|adres|místo\s+konání/i, "Místo konání"],
  [/velikost/i, "Velikost"],
  [/značk/i, "Značka"],
  [/model/i, "Model"],
  [/materiál|material/i, "Materiál"],
  [/výbava|vybavení|doplňk/i, "Výbava"],
  [/technick[ýá]\s+stav|stav\s+zboží|celkov[ýá]\s+stav/i, "Stav"],
  [/bateri/i, "Baterie"],
  [/dispozic/i, "Dispozice"],
  [/ploch[auy]\s|m²|m2/i, "Plocha"],
];

/** Z dlouhé otázky AI udělá krátký popisek pro odrážku v inzerátu. */
export function shortenQuestionLabel(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) return trimmed;

  for (const [pattern, short] of QUESTION_SHORT_LABELS) {
    if (pattern.test(trimmed)) return short;
  }

  return trimmed
    .replace(/\?$/, "")
    .replace(/\s*\([^)]*\)\s*$/, "")
    .replace(/^prosím,?\s*/i, "")
    .trim()
    .slice(0, 48);
}

/** Naformátuje odpověď (km, Kč, rok…) pro zobrazení v popisu. */
export function formatAnswerForDisplay(
  questionLabel: string,
  answer: string,
): string {
  const trimmed = answer.trim();
  if (!trimmed) return trimmed;

  const q = questionLabel.toLowerCase();

  if (/cena|představa\s+o\s+cen/i.test(q)) {
    const amount = parsePriceInput(trimmed);
    if (amount != null) return `${formatCzkAmount(amount)} Kč`;
  }

  if (/najeto|kilometr|nájezd/i.test(q)) {
    const amount = parsePriceInput(trimmed);
    if (amount != null) return `${formatCzkAmount(amount)} km`;
  }

  if (/rok\s+výroby/i.test(q) && /^\d{4}$/.test(trimmed)) {
    return trimmed;
  }

  if (/stk|technick/i.test(q) && /^\d{4}$/.test(trimmed)) {
    return trimmed;
  }

  return trimmed;
}

/** Jedna odrážka: „• Rok výroby: 2016“ */
export function formatQuestionAnswerAsBullet(
  questionLabel: string,
  answer: string,
): string {
  const shortLabel = shortenQuestionLabel(questionLabel);
  const formattedAnswer = formatAnswerForDisplay(questionLabel, answer);
  return `• ${shortLabel}: ${formattedAnswer}`;
}
