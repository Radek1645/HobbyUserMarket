/** Nahradí e-mail a telefon v popisu — PRD §5.4, server-side pojistka. */
const CONTACT_PLACEHOLDER = "[SKRYTO – použij chráněné pole]";

const EMAIL_PATTERN =
  /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;

/** České a obecné formáty telefonu (9+ číslic s volitelnou předvolbou). */
const PHONE_PATTERN =
  /(?:\+?\d{1,3}[\s.-]?)?(?:\d[\s.-]?){8,}\d/g;

export function stripContactInfo(text: string): string {
  return text
    .replace(EMAIL_PATTERN, CONTACT_PLACEHOLDER)
    .replace(PHONE_PATTERN, CONTACT_PLACEHOLDER);
}
