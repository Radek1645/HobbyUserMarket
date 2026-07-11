import { getPriceTypeLabel } from "@/config/categories";
import { formatCzkAmount } from "@/lib/posts/price-input";
import type { CategoryType, PriceType } from "@/types/post";

export function formatListingPrice(
  categoryType: CategoryType,
  priceType: PriceType,
  priceAmount: number | null,
  exchangeFor?: string | null,
): string {
  const label = getPriceTypeLabel(categoryType, priceType);

  if (categoryType === "sluzby") {
    if (priceType === "fixed" && priceAmount != null) {
      return `${formatCzkAmount(priceAmount)} Kč/h`;
    }

    if (priceType === "negotiable" && priceAmount != null) {
      return `od ${formatCzkAmount(priceAmount)} Kč za zakázku`;
    }

    return label;
  }

  if (priceType === "fixed" && priceAmount != null) {
    return `${formatCzkAmount(priceAmount)} Kč`;
  }

  if (priceType === "negotiable" && priceAmount != null) {
    return `cca ${formatCzkAmount(priceAmount)} Kč (dohodou)`;
  }

  if (priceType === "exchange" && exchangeFor?.trim()) {
    return `Výměnou za ${exchangeFor.trim()}`;
  }

  return label;
}
