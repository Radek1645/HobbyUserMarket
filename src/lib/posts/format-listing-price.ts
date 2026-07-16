import { getPriceTypeLabel } from "@/config/categories";
import { formatCzkAmount } from "@/lib/posts/price-input";
import type { CategoryType, PriceType } from "@/types/post";

export type FormatListingPriceOptions = {
  /**
   * Na kartách u práce prefix „odměna“ (platím já).
   * Na detailu vypnout — label pole už říká Odměna.
   */
  jobRewardPrefix?: boolean;
};

export function formatListingPrice(
  categoryType: CategoryType,
  priceType: PriceType,
  priceAmount: number | null,
  exchangeFor?: string | null,
  options?: FormatListingPriceOptions,
): string {
  const label = getPriceTypeLabel(categoryType, priceType);
  const jobRewardPrefix = options?.jobRewardPrefix === true;

  if (categoryType === "sluzby") {
    if (priceType === "fixed" && priceAmount != null) {
      return `${formatCzkAmount(priceAmount)} Kč/h`;
    }

    if (priceType === "negotiable" && priceAmount != null) {
      return `od ${formatCzkAmount(priceAmount)} Kč za zakázku`;
    }

    return label;
  }

  if (categoryType === "prace") {
    if (priceType === "fixed" && priceAmount != null) {
      const amount = `${formatCzkAmount(priceAmount)} Kč/h`;
      return jobRewardPrefix ? `odměna ${amount}` : amount;
    }

    if (priceType === "negotiable" && priceAmount != null) {
      const amount = `${formatCzkAmount(priceAmount)} Kč`;
      return jobRewardPrefix ? `odměna ${amount}` : amount;
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
