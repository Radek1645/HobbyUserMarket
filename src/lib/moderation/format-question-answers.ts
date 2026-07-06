import {
  formatCzkAmount,
  parsePriceInput,
} from "@/lib/posts/price-input";
import type { ModerationQuestion } from "@/lib/moderation/types";

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
  [/účel\s+pozemku/i, "Účel pozemku"],
  [/inženýrsk[éá]\s+sít/i, "Inženýrské sítě"],
  [/přístupov[áaé]\s+cest/i, "Přístupová cesta"],
  [/poplatky|kauce|záloh/i, "Poplatky a kauce"],
  [/patro|podlaž/i, "Patro"],
  [/výtah/i, "Výtah"],
  [/parkován/i, "Parkování"],
];

function capitalizeFirst(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Z dlouhé otázky AI udělá krátký popisek pro odrážku v inzerátu. */
export function shortenQuestionLabel(label: string): string {
  const trimmed = label.trim().replace(/\?$/, "");
  if (!trimmed) return trimmed;

  for (const [pattern, short] of QUESTION_SHORT_LABELS) {
    if (pattern.test(trimmed)) return short;
  }

  const directQuestion = /^(?:prosím,?\s*)?(?:jaký|jaká|jaké|jakou)\s+(?:je|jsou|bývá|bude)\s+(.+)$/i.exec(
    trimmed,
  );
  if (directQuestion?.[1]) {
    return capitalizeFirst(
      directQuestion[1]
        .replace(/\s+dostupné$/i, "")
        .replace(/\s+u\s+nemovitosti$/i, "")
        .trim(),
    );
  }

  const invertedQuestion =
    /^(?:prosím,?\s*)?(?:jaký|jaká|jaké|jakou)\s+(.+?)\s+(?:je|jsou|bývá|bude)\b/i.exec(
      trimmed,
    );
  if (invertedQuestion?.[1]) {
    return capitalizeFirst(
      invertedQuestion[1]
        .replace(/\s+dostupné$/i, "")
        .trim(),
    );
  }

  const ktereQuestion = /^kter[éýá]\s+(.+?)\s+(?:je|jsou|platí|bude)\b/i.exec(
    trimmed,
  );
  if (ktereQuestion?.[1]) {
    return capitalizeFirst(ktereQuestion[1].trim());
  }

  return trimmed
    .replace(/\s*\([^)]*\)\s*$/, "")
    .replace(/^prosím,?\s*/i, "")
    .trim()
    .slice(0, 48);
}

/** Krátký popisek parametru — priorita paramLabel z AI, jinak heuristika. */
export function resolveParameterLabel(
  question: Pick<ModerationQuestion, "label" | "paramLabel">,
): string {
  const fromAi = question.paramLabel?.trim();
  if (fromAi) return fromAi.replace(/:$/, "");
  return shortenQuestionLabel(question.label);
}

/** Naformátuje odpověď (km, Kč, m², rok…) pro zobrazení v popisu. */
export function formatAnswerForDisplay(
  questionLabel: string,
  answer: string,
  paramLabel?: string,
): string {
  const trimmed = answer.trim();
  if (!trimmed) return trimmed;

  const q = questionLabel.toLowerCase();
  const label = (paramLabel ?? shortenQuestionLabel(questionLabel)).toLowerCase();

  if (/cena|představa\s+o\s+cen/i.test(q) || label === "cena") {
    const amount = parsePriceInput(trimmed);
    if (amount != null) return `${formatCzkAmount(amount)} Kč`;
  }

  if (/najeto|kilometr|nájezd/i.test(q) || label === "nájezd") {
    const amount = parsePriceInput(trimmed);
    if (amount != null) return `${formatCzkAmount(amount)} km`;
  }

  if (
    (/ploch|m²|m2|metr/i.test(q) || label === "plocha") &&
    !/m²|m2/i.test(trimmed)
  ) {
    const amount = parsePriceInput(trimmed);
    if (amount != null) return `${formatCzkAmount(amount)} m²`;
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
  question: Pick<ModerationQuestion, "label" | "paramLabel">,
  answer: string,
): string {
  const shortLabel = resolveParameterLabel(question);
  const formattedAnswer = formatAnswerForDisplay(
    question.label,
    answer,
    shortLabel,
  );
  return `• ${shortLabel}: ${formattedAnswer}`;
}
