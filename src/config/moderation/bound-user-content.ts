/** Tagy pro oddělení uživatelského obsahu od instrukcí (M10 — prompt injection). */
export const LISTING_PROMPT_TAGS = {
  title: "listing_title",
  description: "listing_description",
  condition: "listing_condition",
  eventDate: "listing_event_date",
} as const;

/** Odstraní pokusy o předčasné ukončení tagu v textu od uživatele. */
export function sanitizeUserContentForPromptBoundary(text: string): string {
  return text.replace(/<\/?listing_[a-z_]+>/gi, "");
}

export function wrapListingUserField(tag: string, content: string): string {
  const body = sanitizeUserContentForPromptBoundary(content).trim();
  return `<${tag}>\n${body}\n</${tag}>`;
}
