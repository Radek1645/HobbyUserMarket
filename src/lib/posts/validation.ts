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
import type { CategoryType, ConditionLabel, PriceType } from "@/types/post";

export type CreateListingInput = {
  categoryType: CategoryType;
  subcategorySlug: string;
  conditionLabel: ConditionLabel;
  title: string;
  description: string;
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
};

export type ValidationResult =
  | { ok: true; data: CreateListingInput }
  | { ok: false; error: string };

export type ValidateListingOptions = {
  /** Při editaci — stejné datum akce jako v DB projde i když je v minulosti. */
  existingEventDate?: string | null;
};

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
      throw new Error("Zadej cenu v Kč.");
    }
    throw new Error("U ceny dohodou uveď orientační částku v Kč.");
  }

  const amount = parsePriceInput(trimmed);
  if (amount == null || amount < 0) {
    throw new Error("Zadej platnou cenu v Kč.");
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
        throw new Error("Zadej telefonní číslo, nebo vypni zobrazení telefonu.");
      }
      if (!isValidContactPhone(contactPhoneRaw)) {
        throw new Error(
          "Telefon musí mít 9–15 číslic (můžeš uvést mezinárodní předvolbu).",
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
      return { ok: false, error: "Vyber kategorii." };
    }

    if (!isValidSubcategory(categoryType, subcategorySlug)) {
      return { ok: false, error: "Vyber podkategorii." };
    }

    const category = getCategoryConfig(categoryType);
    if (!category.conditionLabels.some((c) => c.value === conditionLabel)) {
      return {
        ok: false,
        error: `Vyber ${getConditionFieldLabel(categoryType).toLowerCase()}.`,
      };
    }

    if (!category.priceTypes.some((p) => p.value === priceType)) {
      return { ok: false, error: "Vyber typ ceny." };
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
      return { ok: false, error: "Vyber lokalitu z našeptávače nebo použij GPS." };
    }

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return {
        ok: false,
        error: "Vyber obec z našeptávače nebo použij GPS — souřadnice chybí.",
      };
    }

    let listingDurationDays = LISTING_DURATION_DEFAULT_DAYS;
    let eventDate: string | null = null;

    if (categoryType === "udalost") {
      const rawEvent = String(form.get("eventDate") ?? "").trim();
      if (!rawEvent) {
        return { ok: false, error: "Zadej datum a čas akce." };
      }
      const parsed = new Date(rawEvent);
      if (Number.isNaN(parsed.getTime())) {
        return { ok: false, error: "Neplatné datum akce." };
      }

      const existing = options?.existingEventDate
        ? new Date(options.existingEventDate)
        : null;
      const isUnchanged =
        existing != null &&
        !Number.isNaN(existing.getTime()) &&
        parsed.getTime() === existing.getTime();

      if (!isUnchanged && parsed <= new Date()) {
        return { ok: false, error: "Datum akce musí být v budoucnosti." };
      }
      eventDate = parsed.toISOString();
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

    return {
      ok: true,
      data: {
        categoryType,
        subcategorySlug,
        conditionLabel,
        title,
        description,
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
