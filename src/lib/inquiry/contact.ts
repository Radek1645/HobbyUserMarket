import { isValidContactPhone } from "@/lib/posts/contact-phone";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

/** E-mail nebo telefon (CZ/mezinárodní) pro zpětnou vazbu u poptávky. */
export function isValidInquiryContact(raw: string): boolean {
  const value = raw.trim();
  if (value.length < 5) return false;
  if (value.includes("@")) return EMAIL_PATTERN.test(value);
  return isValidContactPhone(value);
}

export const INQUIRY_CONTACT_INVALID_MESSAGE =
  "Zadejte platný e-mail (např. jan@email.cz) nebo telefon (např. +420 777 123 456).";
