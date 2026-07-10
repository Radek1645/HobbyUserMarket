import { Resend } from "resend";
import { getEmailConfig } from "@/lib/email/config";

export type TransactionalEmail = {
  to: string;
  subject: string;
  text: string;
};

/** Odeslání e-mailu; chyby jen loguje — neblokuje hlavní operaci. */
export async function sendTransactionalEmail(
  email: TransactionalEmail,
): Promise<boolean> {
  const config = getEmailConfig();
  if (!config) {
    console.error("email: missing RESEND_API_KEY or sender address");
    return false;
  }

  const resend = new Resend(config.resendKey);
  const { error } = await resend.emails.send({
    from: config.fromEmail,
    to: email.to,
    subject: email.subject,
    text: email.text,
  });

  if (error) {
    console.error("email send failed:", {
      to: email.to,
      subject: email.subject,
      error,
    });
    return false;
  }

  console.info("email sent:", { to: email.to, subject: email.subject });
  return true;
}
