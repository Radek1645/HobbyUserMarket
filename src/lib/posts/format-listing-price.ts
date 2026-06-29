import { getPriceTypeLabel } from "@/config/categories";
import type { CategoryType, PriceType } from "@/types/post";

export function formatListingPrice(
  categoryType: CategoryType,
  priceType: PriceType,
  priceAmount: number | null,
  exchangeFor?: string | null,
): string {
  const label = getPriceTypeLabel(categoryType, priceType);

  if (priceType === "fixed" && priceAmount != null) {
    return `${priceAmount} Kč`;
  }

  if (priceType === "negotiable" && priceAmount != null) {
    return `cca ${priceAmount} Kč (dohodou)`;
  }

  if (priceType === "exchange" && exchangeFor?.trim()) {
    return `Výměnou za ${exchangeFor.trim()}`;
  }

  return label;
}
