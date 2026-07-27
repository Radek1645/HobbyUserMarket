import type { ListingFormInitialValues } from "@/lib/posts/listing-form";
import type { CategoryType, ConditionLabel, PriceType } from "@/types/post";

type ModerationSnapshot = {
  title: string;
  description: string;
  categoryType: CategoryType;
  subcategorySlug: string;
  /** SEC-H01 / SEC-M05 — publish-sensitive pole vázaná na approval fingerprint. */
  conditionLabel?: ConditionLabel | string;
  priceType?: PriceType | string;
  priceAmount?: string | number | null;
  exchangeFor?: string | null;
  locationText?: string;
  latitude?: number | null;
  longitude?: number | null;
  eventDate?: string | null;
  listingDurationDays?: number;
  showContactEmail?: boolean;
  showContactPhone?: boolean;
  contactPhone?: string | null;
  jobCvRequired?: boolean;
};

function sameText(
  left: string | null | undefined,
  right: string | null | undefined,
): boolean {
  return String(left ?? "").trim() === String(right ?? "").trim();
}

function samePriceAmount(
  left: string | number | null | undefined,
  right: string | number | null | undefined,
): boolean {
  const normalize = (value: string | number | null | undefined): string => {
    if (value == null || value === "") return "";
    if (typeof value === "number") {
      return Number.isNaN(value) ? "" : String(value);
    }
    const digits = value.replace(/\D/g, "");
    if (!digits) return "";
    const parsed = Number.parseInt(digits, 10);
    return Number.isNaN(parsed) ? "" : String(parsed);
  };
  return normalize(left) === normalize(right);
}

/**
 * PRD §5.4 / SEC-H01 — u editace při změně textu, kategorie, fotek, nebo
 * publish-sensitive polí (cena, lokalita, stav, datum akce, výměna).
 */
export function listingNeedsModeration(
  current: ModerationSnapshot,
  initial: ListingFormInitialValues,
): boolean {
  return (
    !sameText(current.title, initial.title) ||
    !sameText(current.description, initial.description) ||
    current.categoryType !== initial.categoryType ||
    current.subcategorySlug !== initial.subcategorySlug ||
    (current.conditionLabel != null &&
      current.conditionLabel !== initial.conditionLabel) ||
    (current.priceType != null && current.priceType !== initial.priceType) ||
    (current.priceAmount !== undefined &&
      !samePriceAmount(current.priceAmount, initial.priceAmount)) ||
    (current.exchangeFor !== undefined &&
      !sameText(current.exchangeFor, initial.exchangeFor)) ||
    (current.locationText != null &&
      !sameText(current.locationText, initial.locationText)) ||
    (current.latitude !== undefined &&
      current.latitude !== initial.latitude) ||
    (current.longitude !== undefined &&
      current.longitude !== initial.longitude) ||
    (current.eventDate !== undefined &&
      !sameText(current.eventDate, initial.eventDate)) ||
    (current.listingDurationDays !== undefined &&
      current.listingDurationDays !== initial.listingDurationDays) ||
    (current.showContactEmail !== undefined &&
      current.showContactEmail !== initial.showContactEmail) ||
    (current.showContactPhone !== undefined &&
      current.showContactPhone !== initial.showContactPhone) ||
    (current.contactPhone !== undefined &&
      !sameText(current.contactPhone, initial.contactPhone)) ||
    (current.jobCvRequired !== undefined &&
      current.jobCvRequired !== initial.jobCvRequired)
  );
}
