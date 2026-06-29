import { LISTING_DURATION_PRESETS } from "@/config/app";
import type {
  CategoryType,
  ConditionLabel,
  PostRow,
  PriceType,
} from "@/types/post";
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
  customDuration: boolean;
};

export function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return "";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (value: number) => String(value).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
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
    customDuration,
  };
}
