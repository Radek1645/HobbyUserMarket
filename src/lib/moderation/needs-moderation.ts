import type { ListingFormInitialValues } from "@/lib/posts/listing-form";
import type { CategoryType } from "@/types/post";

type ModerationSnapshot = {
  title: string;
  description: string;
  categoryType: CategoryType;
  subcategorySlug: string;
};

/** PRD §5.4 — u editace jen při změně názvu, popisu, kategorie nebo fotek. */
export function listingNeedsModeration(
  current: ModerationSnapshot,
  initial: ListingFormInitialValues,
): boolean {
  return (
    current.title.trim() !== initial.title.trim() ||
    current.description.trim() !== initial.description.trim() ||
    current.categoryType !== initial.categoryType ||
    current.subcategorySlug !== initial.subcategorySlug
  );
}
