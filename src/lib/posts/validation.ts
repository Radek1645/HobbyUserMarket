import {
  LISTING_DURATION_DEFAULT_DAYS,
  LISTING_DURATION_MAX_DAYS,
  LISTING_DURATION_MIN_DAYS,
  LISTING_DESCRIPTION_MAX_LENGTH,
  LISTING_DESCRIPTION_MIN_LENGTH,
  LISTING_EXCHANGE_FOR_MAX_LENGTH,
} from "@/config/app";
import { getCategoryConfig, getConditionFieldLabel, isValidSubcategory } from "@/config/categories";
import {
  formatContactPhoneForStorage,
  isValidContactPhone,
} from "@/lib/posts/contact-phone";
import { parsePriceInput } from "@/lib/posts/price-input";
import {
  clampListingImageAlt,
  clampListingMetaDescription,
} from "@/lib/seo/clamp-listing-seo-text";
import type { CategoryType, ConditionLabel, PriceType } from "@/types/post";

export type CreateListingInput = {
  categoryType: CategoryType;
  subcategorySlug: string;
  conditionLabel: ConditionLabel;
  title: string;
  description: string;
  /** Před-AI snapshot — jen když klient pošle obě pole (moderace / nový inzerát). */
  originalTitle?: string;
  originalDescription?: string;
  /** True jen po volbě AI textu v náhledu moderace (vyžaduje original snapshot). */
  descriptionAiAssisted?: boolean;
  /**
   * SEO pole z AI — `undefined` = při update neměnit;
   * `null` = vymazat; string = uložit.
   */
  metaDescription?: string | null;
  imageAlt?: string | null;
  locationText: string;
  latitude: number;
  longitude: number;
  priceType: PriceType;
  priceAmount: number | null;
  exchangeFor: string | null;
  listingDurationDays: number;
  eventDate: string | null;
  showContactEmail: boolean;
  showContactPhone: boolean;
  contactPhone: string | null;
  /** Práce/brigády — vyžadovat CV při odpovědi uchazeče. */
  jobCvRequired: boolean;
};

export type ValidationResult =
  | { ok: true; data: CreateListingInput }
  | { ok: false; error: string };

export type ValidateListingOptions = {
  /** Při editaci — stejné datum akce jako v DB projde i když je v minulosti. */
  existingEventDate?: string | null;
};

export type FutureEventDateResult =
  | { ok: true; parsed: Date }
  | { ok: false; error: string };

/** Datum akce musí být v budoucnosti (při editaci projde nezměněné datum z DB). */
export function validateFutureEventDate(
  rawEvent: string,
  options?: Pick<ValidateListingOptions, "existingEventDate">,
  now: Date = new Date(),
): FutureEventDateResult {
  const trimmed = rawEvent.trim();
  if (!trimmed) {
    return { ok: false, error: "Zadejte datum a čas akce." };
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return { ok: false, error: "Neplatné datum akce." };
  }

  const existingRaw = options?.existingEventDate;
  const existing = existingRaw ? new Date(existingRaw) : null;
  const isUnchanged =
    existing != null &&
    !Number.isNaN(existing.getTime()) &&
    parsed.getTime() === existing.getTime();

  if (!isUnchanged && parsed <= now) {
    return { ok: false, error: "Datum akce musí být v budoucnosti." };
  }

  return { ok: true, parsed };
}

function parsePriceAmount(
  priceType: PriceType,
  raw: string,
): number | null {
  if (priceType !== "fixed" && priceType !== "negotiable") {
    return null;
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    if (priceType === "fixed") {
      throw new Error("Zadejte cenu v Kč.");
    }
    throw new Error("U ceny dohodou uveď orientační částku v Kč.");
  }

  const amount = parsePriceInput(trimmed);
  if (amount == null || amount < 0) {
    throw new Error("Zadejte platnou cenu v Kč.");
  }

  if (priceType === "negotiable" && amount < 1) {
    throw new Error("Orientační cena musí být alespoň 1 Kč.");
  }

  return amount;
}

export function validateListingForm(
  form: FormData,
  options?: ValidateListingOptions,
): ValidationResult {
  try {
    const categoryType = form.get("categoryType") as CategoryType;
    const subcategorySlug = String(form.get("subcategorySlug") ?? "").trim();
    const conditionLabel = form.get("conditionLabel") as ConditionLabel;
    const title = String(form.get("title") ?? "").trim();
    const description = String(form.get("description") ?? "").trim();
    const originalTitleField = form.get("originalTitle");
    const originalDescriptionField = form.get("originalDescription");
    const hasOriginalSnapshot =
      originalTitleField !== null && originalDescriptionField !== null;
    const locationText = String(form.get("locationText") ?? "").trim();
    const latitude = Number.parseFloat(String(form.get("latitude") ?? ""));
    const longitude = Number.parseFloat(String(form.get("longitude") ?? ""));
    const priceType = form.get("priceType") as PriceType;
    const priceAmount = parsePriceAmount(
      priceType,
      String(form.get("priceAmount") ?? ""),
    );
    const showContactEmail = form.get("showContactEmail") === "true";
    const showContactPhone = form.get("showContactPhone") === "true";
    const contactPhoneRaw = String(form.get("contactPhone") ?? "").trim();
    let contactPhone: string | null = null;

    if (showContactPhone) {
      if (!contactPhoneRaw) {
        throw new Error("Zadejte telefonní číslo, nebo vypněte zobrazení telefonu.");
      }
      if (!isValidContactPhone(contactPhoneRaw)) {
        throw new Error(
          "Telefon musí mít 9–15 číslic (můžete uvést mezinárodní předvolbu).",
        );
      }
      contactPhone = formatContactPhoneForStorage(contactPhoneRaw);
    }

    const rawExchangeFor = String(form.get("exchangeFor") ?? "").trim();
    const exchangeFor =
      priceType === "exchange"
        ? rawExchangeFor.length > 0
          ? rawExchangeFor
          : null
        : null;

    if (
      priceType === "exchange" &&
      exchangeFor != null &&
      exchangeFor.length > LISTING_EXCHANGE_FOR_MAX_LENGTH
    ) {
      return {
        ok: false,
        error: `Popis výměny může mít maximálně ${LISTING_EXCHANGE_FOR_MAX_LENGTH} znaků.`,
      };
    }

    if (!categoryType || !getCategoryConfig(categoryType)) {
      return { ok: false, error: "Vyberte kategorii." };
    }

    if (!isValidSubcategory(categoryType, subcategorySlug)) {
      return { ok: false, error: "Vyberte podkategorii." };
    }

    const category = getCategoryConfig(categoryType);
    if (!category.conditionLabels.some((c) => c.value === conditionLabel)) {
      return {
        ok: false,
        error: `Vyberte ${getConditionFieldLabel(categoryType).toLowerCase()}.`,
      };
    }

    if (!category.priceTypes.some((p) => p.value === priceType)) {
      return { ok: false, error: "Vyberte typ ceny." };
    }

    if (title.length < 1 || title.length > 80) {
      return { ok: false, error: "Název musí mít 1–80 znaků." };
    }

    if (description.length < LISTING_DESCRIPTION_MIN_LENGTH) {
      return {
        ok: false,
        error: `Popis musí mít alespoň ${LISTING_DESCRIPTION_MIN_LENGTH} znaků.`,
      };
    }

    if (description.length > LISTING_DESCRIPTION_MAX_LENGTH) {
      return {
        ok: false,
        error: `Popis může mít maximálně ${LISTING_DESCRIPTION_MAX_LENGTH} znaků.`,
      };
    }

    if (!locationText) {
      return { ok: false, error: "Zadejte a potvrďte obec z našeptávače." };
    }

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return {
        ok: false,
        error: "Vyberte obec z našeptávače — bez potvrzené lokality inzerát neuložíme.",
      };
    }

    let listingDurationDays = LISTING_DURATION_DEFAULT_DAYS;
    let eventDate: string | null = null;

    if (categoryType === "udalost") {
      const rawEvent = String(form.get("eventDate") ?? "");
      const eventValidation = validateFutureEventDate(rawEvent, options);
      if (!eventValidation.ok) {
        return { ok: false, error: eventValidation.error };
      }
      eventDate = eventValidation.parsed.toISOString();
    } else {
      listingDurationDays = Number.parseInt(
        String(form.get("listingDurationDays") ?? LISTING_DURATION_DEFAULT_DAYS),
        10,
      );
      if (
        Number.isNaN(listingDurationDays) ||
        listingDurationDays < LISTING_DURATION_MIN_DAYS ||
        listingDurationDays > LISTING_DURATION_MAX_DAYS
      ) {
        return {
          ok: false,
          error: `Platnost musí být ${LISTING_DURATION_MIN_DAYS}–${LISTING_DURATION_MAX_DAYS} dní.`,
        };
      }
    }

    const jobCvRequired =
      categoryType === "prace" && form.get("jobCvRequired") === "true";

    const seoFieldsProvided = form.get("seoFieldsProvided") === "true";
    let metaDescription: string | null | undefined;
    let imageAlt: string | null | undefined;

    if (seoFieldsProvided) {
      const rawMeta = String(form.get("metaDescription") ?? "").trim();
      const rawAlt = String(form.get("imageAlt") ?? "").trim();

      const clampedMeta = clampListingMetaDescription(rawMeta);
      const clampedAlt = clampListingImageAlt(rawAlt);

      metaDescription = clampedMeta.length > 0 ? clampedMeta : null;
      imageAlt = clampedAlt.length > 0 ? clampedAlt : null;
    }

    return {
      ok: true,
      data: {
        categoryType,
        subcategorySlug,
        conditionLabel,
        title,
        description,
        ...(hasOriginalSnapshot
          ? {
              originalTitle: String(originalTitleField).trim(),
              originalDescription: String(originalDescriptionField).trim(),
              descriptionAiAssisted:
                form.get("descriptionAiAssisted") === "true",
            }
          : {}),
        ...(seoFieldsProvided
          ? { metaDescription, imageAlt }
          : {}),
        locationText,
        latitude,
        longitude,
        priceType,
        priceAmount,
        exchangeFor,
        listingDurationDays,
        eventDate,
        showContactEmail,
        showContactPhone,
        contactPhone,
        jobCvRequired,
      },
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Neplatná data formuláře.",
    };
  }
}

export function validateCreateListing(form: FormData): ValidationResult {
  return validateListingForm(form);
}

export function validateUpdateListing(
  form: FormData,
  existingEventDate: string | null,
): ValidationResult {
  return validateListingForm(form, { existingEventDate });
}
