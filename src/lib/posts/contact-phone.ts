/** Normalizace a validace telefonu pro kontakt u inzerátu (bez SMS ověření). */

const MIN_DIGITS = 9;
const MAX_DIGITS = 15;
export const CONTACT_PHONE_MAX_LENGTH = 30;

/** Návrh formátu ve formuláři (placeholder). */
export const CONTACT_PHONE_PLACEHOLDER = "+420 777 123 456";

export function normalizeContactPhoneInput(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

/** Min. 9 číslic, max. 15 včetně předvolby — libovolná země. */
export function isValidContactPhone(raw: string): boolean {
  const digits = raw.replace(/\D/g, "");
  return digits.length >= MIN_DIGITS && digits.length <= MAX_DIGITS;
}

export function formatContactPhoneForStorage(raw: string): string {
  return normalizeContactPhoneInput(raw).slice(0, CONTACT_PHONE_MAX_LENGTH);
}
