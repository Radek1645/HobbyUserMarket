import type { CategoryType } from "@/types/post";

/** Zbožové domény (stav new/like_new/used/damaged, Product JSON-LD, exit poll „prodáno“). */
export const GOODS_CATEGORY_TYPES = [
  "auto",
  "detsky",
  "dum",
  "elektro",
  "moda",
  "sport",
  "hobby",
  "ostatni",
] as const satisfies readonly CategoryType[];

export type GoodsCategoryType = (typeof GOODS_CATEGORY_TYPES)[number];

export function isGoodsCategoryType(
  categoryType: string | null | undefined,
): categoryType is GoodsCategoryType {
  return (
    !!categoryType &&
    (GOODS_CATEGORY_TYPES as readonly string[]).includes(categoryType)
  );
}
