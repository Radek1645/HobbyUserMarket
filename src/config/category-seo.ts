import { CATEGORIES } from "@/config/categories";
import type { CategoryType } from "@/types/post";

/** Celostátní práh aktivních inzerátů pro index (CATEGORY_SEO §2). */
export const CATEGORY_SEO_NATIONAL_THRESHOLD = 3;

/** Lokalitní práh — Vlna 2 (vyšší laťka než celostátní). */
export const CATEGORY_SEO_LOCALITY_THRESHOLD = 5;

/** Dny kontinuálně nad prahem před noindex → index. */
export const CATEGORY_SEO_ENTER_HYSTERESIS_DAYS = 3;

/** Dny kontinuálně pod prahem před index → noindex. */
export const CATEGORY_SEO_EXIT_HYSTERESIS_DAYS = 14;

/** Zbožové category_type — jediné oprávněné pro bare `/{slug}/`. */
export const CATEGORY_SEO_GOODS_TYPES = [
  "auto",
  "detsky",
  "dum",
  "elektro",
  "moda",
  "sport",
  "hobby",
  "ostatni",
] as const satisfies readonly CategoryType[];

const GOODS_TYPE_SET = new Set<string>(CATEGORY_SEO_GOODS_TYPES);

/** Priorita Vlny 1 — ruční copy / první zapnutí (WAVE1). */
export const CATEGORY_SEO_WAVE1_PRIORITY_SLUGS = [
  "kola-kolobezky",
  "kocarky-sedacky-nabytek",
  "osobni-auta",
  "zimni-sport",
  "detske-obleceni-obuv",
  "nabytek-doplnky",
  "mobily",
  "zahrada-naradi",
  "hracky-miminka",
] as const;

export type CategorySeoIndexStatus = "index" | "noindex";

export type CategorySeoPageRow = {
  slug: string;
  kind: "subcategory" | "category_type";
  description: string | null;
  meta_title: string | null;
  meta_description: string | null;
  index_status: CategorySeoIndexStatus;
  listing_count: number;
  above_threshold_since: string | null;
  below_threshold_since: string | null;
  updated_at: string;
};

/** Unikátní goods subcategory slugy vhodné pro `/{slug}/`. */
export function listUniqueGoodsSeoSlugs(): string[] {
  const occurrences = new Map<string, { count: number; goodsParent: boolean }>();

  for (const category of CATEGORIES) {
    const goodsParent = GOODS_TYPE_SET.has(category.type);
    for (const sub of category.subcategories) {
      const prev = occurrences.get(sub.slug);
      if (!prev) {
        occurrences.set(sub.slug, { count: 1, goodsParent });
      } else {
        occurrences.set(sub.slug, {
          count: prev.count + 1,
          goodsParent: prev.goodsParent || goodsParent,
        });
      }
    }
  }

  return [...occurrences.entries()]
    .filter(([, info]) => info.count === 1 && info.goodsParent)
    .map(([slug]) => slug)
    .sort();
}

const UNIQUE_GOODS_SEO_SLUG_SET = new Set(listUniqueGoodsSeoSlugs());

export function isCategorySeoLandingSlug(slug: string): boolean {
  return UNIQUE_GOODS_SEO_SLUG_SET.has(slug);
}

export function getCategorySeoPath(slug: string): string {
  return `/${slug}`;
}

/** Doména (category_type) pro goods subcategory slug, nebo null. */
export function getGoodsCategoryTypeForSeoSlug(
  slug: string,
): CategoryType | null {
  if (!isCategorySeoLandingSlug(slug)) return null;

  for (const category of CATEGORIES) {
    if (!GOODS_TYPE_SET.has(category.type)) continue;
    if (category.subcategories.some((sub) => sub.slug === slug)) {
      return category.type;
    }
  }

  return null;
}

export function getGoodsSubcategoryLabelForSeoSlug(slug: string): string | null {
  const categoryType = getGoodsCategoryTypeForSeoSlug(slug);
  if (!categoryType) return null;

  const category = CATEGORIES.find((item) => item.type === categoryType);
  return category?.subcategories.find((sub) => sub.slug === slug)?.label ?? null;
}
