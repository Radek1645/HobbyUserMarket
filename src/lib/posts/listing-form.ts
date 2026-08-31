import { LISTING_DURATION_PRESETS } from "@/config/app";
import type {
  CategoryType,
  ConditionLabel,
  PostRow,
  PriceType,
} from "@/types/post";
import {
  LISTING_DISPLAY_TIME_ZONE,
  parseListingEventDateInput,
} from "@/lib/posts/format-event-date";
import { parsePostLocation } from "@/lib/posts/parse-location";

export type ListingFormInitialValues = {
  categoryType: CategoryType;
  subcategorySlug: string;
  conditionLabel: ConditionLabel;
  title: string;
  description: string;
  locationText: string;
  latitude: number | null;
  longitude: number | null;
  priceType: PriceType;
  priceAmount: string;
  exchangeFor: string;
  listingDurationDays: number;
  eventDate: string;
  eventEndDate: string;
  isPrivate: boolean;
  customDuration: boolean;
  showContactEmail: boolean;
  showContactPhone: boolean;
  contactPhone: string;
  jobCvRequired: boolean;
  externalUrl: string;
};

export function dateToDatetimeLocalValue(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: LISTING_DISPLAY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${value("year")}-${value("month")}-${value("day")}T${value("hour")}:${value("minute")}`;
}

export function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return "";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  return dateToDatetimeLocalValue(date);
}

/**
 * Převod `datetime-local` z prohlížeče na ISO UTC.
 * Stejný řetězec musí jít do Edge (fingerprint) i do hidden `eventDate`
 * (Server Action na Vercelu je taky UTC — naive `15:00` by uložilo 15:00Z).
 */
export function toModerationEventDateIso(
  value: string | null | undefined,
): string | undefined {
  const parsed = parseListingEventDateInput(value);
  if (!parsed) return undefined;
  return parsed.toISOString();
}

export function postToListingFormInitialValues(
  post: PostRow,
  location: unknown,
): ListingFormInitialValues {
  const coords = parsePostLocation(location);
  const listingDurationDays = post.listing_duration_days;
  const customDuration = !LISTING_DURATION_PRESETS.includes(
    listingDurationDays as (typeof LISTING_DURATION_PRESETS)[number],
  );

  return {
    categoryType: post.category_type,
    subcategorySlug: post.subcategory_slug,
    conditionLabel: post.condition_label,
    title: post.title,
    description: post.description,
    locationText: post.location_text,
    latitude: coords?.latitude ?? null,
    longitude: coords?.longitude ?? null,
    priceType: post.price_type,
    priceAmount:
      post.price_amount != null ? String(post.price_amount) : "",
    exchangeFor: post.exchange_for ?? "",
    listingDurationDays,
    eventDate: toDatetimeLocalValue(post.event_date),
    eventEndDate: toDatetimeLocalValue(post.event_end_date ?? null),
    isPrivate: post.is_private === true,
    customDuration,
    showContactEmail: post.show_contact_email ?? false,
    showContactPhone: post.show_contact_phone ?? false,
    contactPhone:
      post.show_contact_phone && post.contact_phone?.trim()
        ? post.contact_phone.trim()
        : "",
    jobCvRequired: post.job_cv_required ?? false,
    externalUrl: post.external_url ?? "",
  };
}
