const NICKNAME_MIN = 3;
const NICKNAME_MAX = 30;
const NICKNAME_PATTERN = /^[\p{L}\p{N}_-]+$/u;

export function isPlaceholderNickname(nickname: string): boolean {
  return nickname.startsWith("user_");
}

export function normalizeNickname(raw: string): string {
  return raw.trim().toLowerCase();
}

export function validateNickname(
  raw: string,
  options?: { optional?: boolean },
): string | null {
  const nickname = normalizeNickname(raw);

  if (options?.optional && nickname.length === 0) {
    return null;
  }

  if (nickname.length < NICKNAME_MIN) {
    return `Přezdívka musí mít alespoň ${NICKNAME_MIN} znaky.`;
  }

  if (nickname.length > NICKNAME_MAX) {
    return `Přezdívka může mít nejvýše ${NICKNAME_MAX} znaků.`;
  }

  if (!NICKNAME_PATTERN.test(nickname)) {
    return "Použij jen písmena, čísla, podtržítko nebo pomlčku.";
  }

  if (isPlaceholderNickname(nickname)) {
    return "Tato přezdívka není k dispozici.";
  }

  return null;
}

function slugifyForNickname(input: string): string {
  return input
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, NICKNAME_MAX);
}

/** Pro firmu: prázdné → null; neplatné znaky → slug (např. „Infotec s.r.o“ → infotec_sro). */
export function resolveCompanyInternalNickname(raw: string): string | null {
  const normalized = normalizeNickname(raw);
  if (!normalized) {
    return null;
  }

  const validationError = validateNickname(raw);
  if (!validationError) {
    return normalized;
  }

  const slugified = slugifyForNickname(raw);
  if (
    slugified.length >= NICKNAME_MIN &&
    NICKNAME_PATTERN.test(slugified) &&
    !isPlaceholderNickname(slugified)
  ) {
    return slugified;
  }

  return null;
}

export function generateCompanyNickname(
  companyName: string,
  userId: string,
): string {
  const suffix = userId.replace(/-/g, "").slice(0, 6);
  const maxBaseLength = Math.max(NICKNAME_MIN, NICKNAME_MAX - suffix.length - 1);
  const base = slugifyForNickname(companyName).slice(0, maxBaseLength) || "firma";

  return `${base}_${suffix}`.slice(0, NICKNAME_MAX);
}
