import type { CategoryType } from "@/types/post";

/**
 * Směr transakce na kartě — Služby = nabízím práci, Práce = hledám člověka.
 * Ostatní kategorie nemají záměnu nabídka/poptávka ve stejném smyslu.
 */
export function getListingIntentLabel(
  categoryType: CategoryType,
): string | null {
  if (categoryType === "sluzby") return "Nabízím službu";
  if (categoryType === "prace") return "Hledám člověka";
  return null;
}
