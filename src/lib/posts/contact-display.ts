/** Náhled e-mailu ve formuláři — uživatel vidí, co se odtajní. */
export function formatEmailPreviewForForm(email: string): string {
  const trimmed = email.trim();
  const at = trimmed.indexOf("@");
  if (at <= 0) return trimmed;

  const local = trimmed.slice(0, at);
  return `${local}@…`;
}

export function hasDirectContactChannels(
  showEmail: boolean,
  showPhone: boolean,
): boolean {
  return showEmail === true || showPhone === true;
}

/** Přímý kontakt jen po explicitním opt-in ve formuláři (NULL/false = skrýt). */
export function postAllowsDirectContact(post: {
  show_contact_email?: boolean | null;
  show_contact_phone?: boolean | null;
}): boolean {
  return (
    post.show_contact_email === true || post.show_contact_phone === true
  );
}
