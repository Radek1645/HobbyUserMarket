/** Ponechá jen číslice — pro stav formuláře a parsování. */
export function stripPriceDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** Formát ceny pro input (české oddělení tisíců mezerou). */
export function formatPriceInput(digits: string): string {
  const cleaned = stripPriceDigits(digits);
  if (!cleaned) return "";

  const amount = Number.parseInt(cleaned, 10);
  if (Number.isNaN(amount)) return "";

  return amount.toLocaleString("cs-CZ");
}

/** Parsuje naformátovanou nebo surovou hodnotu na celé Kč. */
export function parsePriceInput(value: string): number | null {
  const cleaned = stripPriceDigits(value);
  if (!cleaned) return null;

  const amount = Number.parseInt(cleaned, 10);
  return Number.isNaN(amount) ? null : amount;
}

/** Zobrazení částky v Kč (karty, detail). */
export function formatCzkAmount(amount: number): string {
  return amount.toLocaleString("cs-CZ");
}
