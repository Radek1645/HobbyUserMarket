const GENERIC_INQUIRY_SEND_ERROR =
  "Poptávku se nepodařilo odeslat. Zkuste to prosím později.";

function extractErrorMessage(error: unknown): string | null {
  if (!error || typeof error !== "object") {
    return null;
  }

  const message = (error as { message?: unknown }).message;
  if (typeof message === "string" && message.trim()) {
    return message.trim();
  }

  return null;
}

/** V dev režimu vrátí detail z Resend; v produkci obecnou hlášku. */
export function inquirySendErrorMessage(error: unknown): string {
  if (process.env.NODE_ENV !== "development") {
    return GENERIC_INQUIRY_SEND_ERROR;
  }

  const detail = extractErrorMessage(error);
  if (!detail) {
    return GENERIC_INQUIRY_SEND_ERROR;
  }

  return `Poptávku se nepodařilo odeslat: ${detail}`;
}
