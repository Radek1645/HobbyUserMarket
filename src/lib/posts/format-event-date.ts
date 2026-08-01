/** Zobrazení event_date / datetime-local — vždy česká zóna (Edge i Vercel běží v UTC). */
export const LISTING_DISPLAY_TIME_ZONE = "Europe/Prague";

/** cs-CZ medium + short v Europe/Prague (formulářová pravda pro uživatele v ČR). */
export function formatListingEventDate(
  iso: string | null | undefined,
): string | null {
  const trimmed = String(iso ?? "").trim();
  if (!trimmed) return null;

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed.toLocaleString("cs-CZ", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: LISTING_DISPLAY_TIME_ZONE,
  });
}
