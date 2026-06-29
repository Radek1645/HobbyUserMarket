/** Normalizace a validace českého IČO (formát + kontrolní číslice). */

export function normalizeIco(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 8);
}

export function formatIcoDisplay(ico: string): string {
  const digits = normalizeIco(ico);
  if (digits.length !== 8) return digits;
  return `${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5)}`;
}

/** Kontrolní součet dle standardního algoritmu pro české IČO. */
export function validateIcoChecksum(ico: string): boolean {
  if (!/^\d{8}$/.test(ico)) return false;

  const weights = [8, 7, 6, 5, 4, 3, 2];
  let sum = 0;

  for (let i = 0; i < 7; i++) {
    sum += Number.parseInt(ico[i]!, 10) * weights[i]!;
  }

  const mod = sum % 11;
  const checkDigit = mod === 0 ? 1 : mod === 1 ? 0 : 11 - mod;

  return checkDigit === Number.parseInt(ico[7]!, 10);
}

export function validateIco(raw: string): string | null {
  const ico = normalizeIco(raw);

  if (!ico) return null;

  if (ico.length !== 8) {
    return "IČO musí mít 8 číslic.";
  }

  if (!validateIcoChecksum(ico)) {
    return "IČO nemá platný formát — zkontroluj číslice.";
  }

  return null;
}
