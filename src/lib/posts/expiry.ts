import {
  LISTING_DURATION_DEFAULT_DAYS,
  clampListingDurationDays,
} from "@/config/app";

export const LISTING_EXPIRY_WARNING =
  "Pozor: Platnost inzerátu končí dříve než vámi zmíněné datum. Opravte platnost nebo datum.";

/** Vypočte datum expirace pro preview v UI (kanonická hodnota je v DB triggeru). */
export function computeListingExpiresAt(
  listingDurationDays: number = LISTING_DURATION_DEFAULT_DAYS,
  from: Date = new Date(),
): Date {
  const days = clampListingDurationDays(listingDurationDays);
  const result = new Date(from);
  result.setDate(result.getDate() + days);
  return result;
}

export function computeEventExpiresAt(eventDate: Date): Date {
  const result = new Date(eventDate);
  result.setDate(result.getDate() + 1);
  return result;
}

/**
 * Soft guardrail: porovná nejpozdější detekované datum v popisu s expirací.
 * AI může poslat `mentionedDates` z JSON; jinak prázdné pole = bez varování.
 */
export function getListingExpiryWarning(
  listingDurationDays: number,
  mentionedDates: Date[],
  from: Date = new Date(),
): string | null {
  if (mentionedDates.length === 0) return null;

  const expiresAt = computeListingExpiresAt(listingDurationDays, from);
  const latestMention = new Date(
    Math.max(...mentionedDates.map((d) => d.getTime())),
  );

  if (latestMention > expiresAt) {
    return LISTING_EXPIRY_WARNING;
  }

  return null;
}

/** Jednoduchá heuristika pro česká data v popisu (dd.mm.yyyy). AI doplní později. */
export function parseMentionedDatesFromText(text: string): Date[] {
  const matches = text.matchAll(/\b(\d{1,2})\.(\d{1,2})\.(\d{4})\b/g);
  const dates: Date[] = [];

  for (const m of matches) {
    const day = Number.parseInt(m[1], 10);
    const month = Number.parseInt(m[2], 10) - 1;
    const year = Number.parseInt(m[3], 10);
    const d = new Date(year, month, day);
    if (!Number.isNaN(d.getTime())) {
      dates.push(d);
    }
  }

  return dates;
}
