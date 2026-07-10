export type EmailConfig = {
  resendKey: string;
  fromEmail: string;
};

export function getEmailConfig(): EmailConfig | null {
  const resendKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail =
    process.env.NOTIFICATION_FROM_EMAIL?.trim() ||
    process.env.INQUIRY_FROM_EMAIL?.trim();

  if (!resendKey || !fromEmail) {
    return null;
  }

  return { resendKey, fromEmail };
}
