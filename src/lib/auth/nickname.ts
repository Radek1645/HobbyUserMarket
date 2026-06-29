const NICKNAME_MIN = 3;
const NICKNAME_MAX = 30;
const NICKNAME_PATTERN = /^[\p{L}\p{N}_-]+$/u;

export function isPlaceholderNickname(nickname: string): boolean {
  return nickname.startsWith("user_");
}

export function normalizeNickname(raw: string): string {
  return raw.trim().toLowerCase();
}

export function validateNickname(raw: string): string | null {
  const nickname = normalizeNickname(raw);

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
