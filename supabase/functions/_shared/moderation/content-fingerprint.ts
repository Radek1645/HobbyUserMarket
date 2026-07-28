/**
 * SEC-H01 — Deno protějšek `src/lib/moderation/content-fingerprint.ts`.
 * Musí počítat identický hash ze stejných polí ve stejném pořadí jako
 * Node verze a SQL `listing_content_fingerprint_from_post`.
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

function canonicalEventDate(value: string | null | undefined): string {
  const trimmed = canonicalText(value);
  if (!trimmed) return "";
  // Očekává ISO UTC z prohlížeče (`toModerationEventDateIso`). Naive
  // datetime-local by na Edge (UTC) posunul čas oproti Server Action.
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString();
}

function canonicalCoordinate(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "";
  return value.toFixed(6);
}

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

export async function computeTextSha256(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function computeListingContentFingerprint(
  fields: ListingFingerprintFields,
): Promise<string> {
  return computeTextSha256(buildFingerprintPayload(fields));
}
