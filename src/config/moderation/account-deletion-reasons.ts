export type AccountDeletionReason = {
  code: string;
  label: string;
};

export const ACCOUNT_DELETION_REASONS: AccountDeletionReason[] = [
  { code: "terms_violation", label: "Porušení podmínek inzerce" },
  { code: "spam", label: "Spam nebo podvodné inzeráty" },
  { code: "harassment", label: "Obtěžování nebo urážky" },
  { code: "reported", label: "Opakované nahlášení uživatele" },
  { code: "gdpr_request", label: "GDPR žádost / právní požadavek" },
  { code: "other", label: "Jiný důvod" },
];

export function getAccountDeletionReasonLabel(code: string): string {
  return (
    ACCOUNT_DELETION_REASONS.find((reason) => reason.code === code)?.label ??
    code
  );
}
