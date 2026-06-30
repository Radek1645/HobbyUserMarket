"use client";

import { MODERATION_ENABLED } from "@/config/moderation";
import { invokeModerateListing } from "@/lib/moderation/moderate-listing-client";
import { listingNeedsModeration } from "@/lib/moderation/needs-moderation";
import { stripContactInfo } from "@/lib/moderation/strip-contacts";
import type { ListingFormInitialValues } from "@/lib/posts/listing-form";
import type {
  ListingModerationInput,
  ListingModerationOutcome,
} from "@/lib/moderation/types";

export type RunListingModerationParams = ListingModerationInput & {
  /** Při editaci — pro rozhodnutí, zda AI vůbec volat. */
  initialValues?: ListingFormInitialValues;
  /** Při editaci — změna pořadí, smazání, nové fotky nebo hlavní náhled. */
  imagesChanged?: boolean;
};

/**
 * Jednotný vstup pro create i edit před odesláním Server Action.
 * Při `MODERATION_ENABLED = false` vrátí okamžitě approved (jen lokální strip kontaktů).
 */
export async function runListingModeration(
  params: RunListingModerationParams,
): Promise<ListingModerationOutcome> {
  const title = params.title.trim();
  const description = params.description.trim();

  if (params.intent === "update" && params.initialValues) {
    const contentChanged =
      listingNeedsModeration(
        {
          title,
          description,
          categoryType: params.categoryType,
          subcategorySlug: params.subcategorySlug,
        },
        params.initialValues,
      ) || Boolean(params.imagesChanged);

    if (!contentChanged && !MODERATION_ENABLED) {
      return {
        ok: true,
        skipped: true,
        cleanedTitle: title,
        cleanedDescription: description,
      };
    }

    if (!contentChanged) {
      return {
        ok: true,
        skipped: true,
        cleanedTitle: title,
        cleanedDescription: stripContactInfo(description),
      };
    }
  }

  if (!MODERATION_ENABLED) {
    return {
      ok: true,
      skipped: true,
      cleanedTitle: title,
      cleanedDescription: stripContactInfo(description),
    };
  }

  return invokeModerateListing({
    intent: params.intent,
    title,
    description,
    categoryType: params.categoryType,
    subcategorySlug: params.subcategorySlug,
    images: params.images,
  });
}
