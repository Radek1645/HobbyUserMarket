/** E-mail pro notifikace moderaci — server-only. */
export function getAdminNotificationEmail(): string | null {
  const direct =
    process.env.ADMIN_NOTIFICATION_EMAIL?.trim() ||
    process.env.OPERATOR_CONTACT_EMAIL?.trim();

  return direct || null;
}
