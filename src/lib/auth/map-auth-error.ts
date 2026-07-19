export const DUPLICATE_EMAIL_MESSAGE =
  "Účet s tímto e-mailem už existuje. Přihlaste se nebo obnovte heslo.";

function mapPasswordError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("different from the old password")) {
    return "Nové heslo se musí lišit od původního.";
  }

  if (lower.includes("pwned") || lower.includes("have been compromised")) {
    return "Zvolené heslo je příliš slabé nebo bylo dříve kompromitované. Zkuste jiné.";
  }

  const minMatch = message.match(/at least\s+(\d+)\s+characters?/i);
  if (minMatch?.[1]) {
    return `Heslo musí mít alespoň ${minMatch[1]} znaků.`;
  }

  if (lower.includes("should contain") || lower.includes("must contain")) {
    return "Heslo nesplňuje požadavky na složitost. Zkuste delší heslo s kombinací písmen, číslic a speciálních znaků.";
  }

  if (lower.includes("weak password")) {
    return "Heslo je příliš slabé. Zkuste delší heslo s kombinací písmen, číslic a speciálních znaků.";
  }

  return "Heslo nesplňuje bezpečnostní požadavky. Zkuste jiné.";
}

/** Mapuje anglické hlášky Supabase/OAuth na CZ text pro UI (P24). */
export function mapAuthError(message: string): string {
  const trimmed = message.trim();
  if (!trimmed) {
    return "Přihlášení se nezdařilo. Zkuste to prosím znovu.";
  }

  const lower = trimmed.toLowerCase();

  if (lower.includes("password")) {
    return mapPasswordError(trimmed);
  }

  if (lower.includes("invalid login credentials")) {
    return "Nesprávný e-mail nebo heslo.";
  }

  if (lower.includes("email not confirmed")) {
    return "E-mail ještě není ověřený. Zkontrolujte schránku a klikněte na odkaz v e-mailu.";
  }

  if (
    lower.includes("user already registered") ||
    lower.includes("already registered") ||
    lower.includes("already exists") ||
    lower.includes("email_exists")
  ) {
    return DUPLICATE_EMAIL_MESSAGE;
  }

  if (
    lower.includes("oauth") ||
    lower.includes("provider") ||
    lower.includes("exchange") ||
    lower.includes("code verifier") ||
    lower.includes("pkce") ||
    lower.includes("flow state") ||
    lower.includes("bad_oauth") ||
    lower.includes("unable to exchange")
  ) {
    return "Přihlášení přes Google se nezdařilo. Zkuste to prosím znovu.";
  }

  if (lower.includes("access_denied") || lower.includes("access denied")) {
    return "Přihlášení bylo zrušeno. Pokud chcete pokračovat, zkuste to znovu.";
  }

  // Nepropouštět surovou angličtinu do UI.
  if (/[a-z]{4,}/i.test(trimmed) && !/[áčďéěíňóřšťúůýž]/i.test(trimmed)) {
    return "Přihlášení se nezdařilo. Zkuste to prosím znovu.";
  }

  return trimmed;
}
