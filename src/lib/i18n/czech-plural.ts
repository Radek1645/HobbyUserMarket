/** České skloňování počtů: 1 jedna, 2–4 few, 0/5+ / 11–14 many. */
export function czechCountLabel(
  count: number,
  forms: { one: string; few: string; many: string },
): string {
  const abs = Math.abs(Math.trunc(count));
  const mod100 = abs % 100;
  const mod10 = abs % 10;

  if (mod100 >= 11 && mod100 <= 14) return forms.many;
  if (mod10 === 1) return forms.one;
  if (mod10 >= 2 && mod10 <= 4) return forms.few;
  return forms.many;
}

/** Např. „0 poptávek“, „1 poptávka“, „3 poptávky“. */
export function formatInquiryCount(count: number): string {
  const n = Math.max(0, Math.trunc(count));
  return `${n} ${czechCountLabel(n, {
    one: "poptávka",
    few: "poptávky",
    many: "poptávek",
  })}`;
}
