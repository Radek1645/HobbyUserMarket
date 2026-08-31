/** Zobrazení event_date / datetime-local — vždy česká zóna (Edge i Vercel běží v UTC). */
export const LISTING_DISPLAY_TIME_ZONE = "Europe/Prague";

const DATETIME_LOCAL_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

function readTimeZoneParts(ms: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(ms));
  const num = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  return {
    year: num("year"),
    month: num("month"),
    day: num("day"),
    hour: num("hour"),
    minute: num("minute"),
    second: num("second"),
  };
}

function timeZonePartsMatch(
  parts: ReturnType<typeof readTimeZoneParts>,
  expected: {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
  },
): boolean {
  return (
    parts.year === expected.year &&
    parts.month === expected.month &&
    parts.day === expected.day &&
    parts.hour === expected.hour &&
    parts.minute === expected.minute &&
    parts.second === expected.second
  );
}

/**
 * `datetime-local` bez zóny = zeď v Europe/Prague.
 * ISO s Z/offset nechá `Date` (jednoznačný okamžik).
 * Vercel i Edge běží v UTC — `new Date("2026-08-29T15:00")` by z 15:00 v Praze
 * udělalo 15:00Z (13:00 v Praze) a fingerprint by neseděl s prohlížečem.
 */
export function parseListingEventDateInput(
  raw: string | null | undefined,
): Date | null {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return null;

  const local = trimmed.match(DATETIME_LOCAL_PATTERN);
  if (local) {
    const year = Number(local[1]);
    const month = Number(local[2]);
    const day = Number(local[3]);
    const hour = Number(local[4]);
    const minute = Number(local[5]);
    const second = Number(local[6] ?? 0);
    const expected = { year, month, day, hour, minute, second };
    const wallAsUtc = Date.UTC(year, month - 1, day, hour, minute, second);
    let guess = wallAsUtc;
    for (let i = 0; i < 4; i += 1) {
      const seen = readTimeZoneParts(guess, LISTING_DISPLAY_TIME_ZONE);
      const seenAsUtc = Date.UTC(
        seen.year,
        seen.month - 1,
        seen.day,
        seen.hour,
        seen.minute,
        seen.second,
      );
      const diff = wallAsUtc - seenAsUtc;
      if (diff === 0) break;
      guess += diff;
    }

    const resolved = readTimeZoneParts(guess, LISTING_DISPLAY_TIME_ZONE);
    if (!timeZonePartsMatch(resolved, expected)) {
      return null;
    }

    return new Date(guess);
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Kalendářní den v Praze (YYYY-MM-DD) — stejný vzor jako event_listing_expires_at. */
export function pragueCalendarDayKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: LISTING_DISPLAY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function pragueWeekdayShort(date: Date): string {
  return date
    .toLocaleDateString("cs-CZ", {
      weekday: "short",
      timeZone: LISTING_DISPLAY_TIME_ZONE,
    })
    .replace(/\.$/, "");
}

function pragueClock(date: Date): string {
  return date.toLocaleTimeString("cs-CZ", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: LISTING_DISPLAY_TIME_ZONE,
  });
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

/** cs-CZ medium + short v Europe/Prague (formulářová pravda pro uživatele v ČR). */
export function formatListingEventDate(
  iso: string | null | undefined,
): string | null {
  const parsed = parseListingEventDateInput(iso);
  if (!parsed) return null;

  return parsed.toLocaleString("cs-CZ", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: LISTING_DISPLAY_TIME_ZONE,
  });
}

/**
 * Jednodenní = stávající formát. Vícedenní: „pá 4. 9. 10:00 – ne 6. 9. 2026 18:00“.
 * Stejný kalendářní den (DB CHECK to teoreticky pustí) formátuje defenzivně.
 */
export function formatListingEventDateRange(
  startIso: string | null | undefined,
  endIso: string | null | undefined,
): string | null {
  const start = parseListingEventDateInput(startIso);
  if (!start) return null;

  const end = parseListingEventDateInput(endIso);
  if (!end) return formatListingEventDate(startIso);

  const startKey = pragueCalendarDayKey(start);
  const endKey = pragueCalendarDayKey(end);
  const startParts = pragueDateParts(start);
  const endParts = pragueDateParts(end);
  const weekdayStart = pragueWeekdayShort(start);
  const weekdayEnd = pragueWeekdayShort(end);
  const clockStart = pragueClock(start);
  const clockEnd = pragueClock(end);

  if (startKey === endKey) {
    return `${weekdayStart} ${startParts.day}. ${startParts.month}. ${startParts.year} ${clockStart}–${clockEnd}`;
  }

  const sameYear = startParts.year === endParts.year;
  const sameMonth = sameYear && startParts.month === endParts.month;
  const startDateLabel = sameMonth
    ? `${startParts.day}.`
    : sameYear
      ? `${startParts.day}. ${startParts.month}.`
      : `${startParts.day}. ${startParts.month}. ${startParts.year}`;
  const endDateLabel = `${endParts.day}. ${endParts.month}. ${endParts.year}`;

  return `${weekdayStart} ${startDateLabel} ${clockStart} – ${weekdayEnd} ${endDateLabel} ${clockEnd}`;
}
