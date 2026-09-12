/** České skloňování počtů: 1 = one, 2–4 = few, jinak (0, 5+) = many. Ne modulo. */
export function czechCountLabel(
  count: number,
  forms: { one: string; few: string; many: string },
): string {
  const abs = Math.abs(Math.trunc(count));
  if (abs === 1) return forms.one;
  if (abs >= 2 && abs <= 4) return forms.few;
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

/** Např. „1 inzerát“, „3 inzeráty“, „12 inzerátů“. */
export function formatListingCount(count: number): string {
  const n = Math.max(0, Math.trunc(count));
  return `${n} ${czechCountLabel(n, {
    one: "inzerát",
    few: "inzeráty",
    many: "inzerátů",
  })}`;
}
