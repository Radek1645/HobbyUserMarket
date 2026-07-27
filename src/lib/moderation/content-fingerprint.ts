import { createHash } from "node:crypto";

/**
 * SEC-H01: přesný finální obsah po AI náhledu a odpovědích na otázky.
 * Finální text se před publikací znovu moderuje; tento otisk pak DB porovná
 * s uloženým řádkem posts.
 */
export type ListingFingerprintFields = {
  title: string;
  description: string;
  categoryType: string;
  subcategorySlug: string;
  conditionLabel: string;
  priceType: string;
  priceAmount: number | null | undefined;
  exchangeFor: string | null | undefined;
  locationText: string;
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  eventDate: string | null | undefined;
  listingDurationDays: number;
  showContactEmail: boolean;
  showContactPhone: boolean;
  contactPhone: string | null | undefined;
  jobCvRequired: boolean;
};

function canonicalText(value: string | null | undefined): string {
  return String(value ?? "")
    .trim()
    .replace(/\r\n?/g, "\n");
}

function canonicalPriceAmount(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "";
  return Number(value).toString();
}

/** Normalizuje ISO/datetime-local zápis stejného okamžiku na stejný tvar. */
function canonicalEventDate(value: string | null | undefined): string {
  const trimmed = canonicalText(value);
  if (!trimmed) return "";
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString();
}

function canonicalCoordinate(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "";
  return value.toFixed(6);
}

/**
 * Stejné pořadí klíčů musí zůstat identické s Deno verzí
 * `supabase/functions/_shared/moderation/content-fingerprint.ts` a SQL
 * `listing_content_fingerprint_from_post` — jinak se hash rozejde.
 */
function buildFingerprintPayload(fields: ListingFingerprintFields): string {
  return JSON.stringify({
    title: canonicalText(fields.title),
    description: canonicalText(fields.description),
    categoryType: canonicalText(fields.categoryType),
    subcategorySlug: canonicalText(fields.subcategorySlug),
    conditionLabel: canonicalText(fields.conditionLabel),
    priceType: canonicalText(fields.priceType),
    priceAmount: canonicalPriceAmount(fields.priceAmount),
    exchangeFor: canonicalText(fields.exchangeFor),
    locationText: canonicalText(fields.locationText),
    latitude: canonicalCoordinate(fields.latitude),
    longitude: canonicalCoordinate(fields.longitude),
    eventDate: canonicalEventDate(fields.eventDate),
    listingDurationDays: fields.listingDurationDays,
    showContactEmail: fields.showContactEmail,
    showContactPhone: fields.showContactPhone,
    contactPhone: canonicalText(fields.contactPhone).replace(/\s+/g, " "),
    jobCvRequired: fields.jobCvRequired,
  });
}

/** SHA-256 hex otisk polí schválených AI moderací (SEC-H01). */
export function computeListingContentFingerprint(
  fields: ListingFingerprintFields,
): string {
  return createHash("sha256").update(buildFingerprintPayload(fields)).digest("hex");
}
