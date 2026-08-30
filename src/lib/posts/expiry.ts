import {
  LISTING_DURATION_DEFAULT_DAYS,
  clampListingDurationDays,
} from "@/config/app";
import {
  LISTING_DISPLAY_TIME_ZONE,
  parseListingEventDateInput,
} from "@/lib/posts/format-event-date";

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

/**
 * Půlnoc Europe/Prague následujícího kalendářního dne po dni konání.
 * Zrcadlo DB `event_listing_expires_at` (migrace 080) — ne event_date + 24 h.
 */
export function computeEventExpiresAt(eventDate: Date): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: LISTING_DISPLAY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(eventDate);
  const num = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  const next = new Date(Date.UTC(num("year"), num("month") - 1, num("day") + 1));
  const year = next.getUTCFullYear();
  const month = String(next.getUTCMonth() + 1).padStart(2, "0");
  const day = String(next.getUTCDate()).padStart(2, "0");
  const parsed = parseListingEventDateInput(`${year}-${month}-${day}T00:00`);
  return parsed ?? next;
}

function pragueDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("cs-CZ", {
    timeZone: LISTING_DISPLAY_TIME_ZONE,
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return {
    day: value("day"),
    month: value("month"),
    year: value("year"),
  };
}

/**
 * Hint pod datetime pickerem události: „… do půlnoci z 31. 8. na 1. 9. 2026.“
 */
export function formatEventListingVisibleUntilHint(eventDate: Date): string {
  const expiresAt = computeEventExpiresAt(eventDate);
  const from = pragueDateParts(eventDate);
  const to = pragueDateParts(expiresAt);
  const fromLabel =
    from.year === to.year
      ? `${from.day}. ${from.month}.`
      : `${from.day}. ${from.month}. ${from.year}`;
  const toLabel = `${to.day}. ${to.month}. ${to.year}`;
  return `Inzerát bude viditelný do půlnoci z ${fromLabel} na ${toLabel}.`;
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
