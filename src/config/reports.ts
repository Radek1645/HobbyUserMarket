/** Důvody nahlášení — PRD §5.3, §11.2 (enum report_reason v DB). */

export type ReportReasonCode =
  | "fraud"
  | "illegal"
  | "sexual"
  | "drugs"
  | "spam"
  | "misconduct"
  | "other"
  | "inappropriate";

export const REPORT_REASONS: ReadonlyArray<{
  code: ReportReasonCode;
  label: string;
}> = [
  { code: "fraud", label: "Podvod" },
  { code: "illegal", label: "Nelegální obsah" },
  { code: "sexual", label: "Sexuální obsah" },
  { code: "drugs", label: "Drogy" },
  { code: "spam", label: "Spam" },
  { code: "misconduct", label: "Nevhodné chování" },
  { code: "other", label: "Jiné" },
];

export const REPORT_REASON_CODES = new Set(
  REPORT_REASONS.map((item) => item.code),
);

export const REPORT_DETAIL_MAX_LENGTH = 500;

export const REPORT_UI = {
  inlineButtonLabel: "Nahlásit inzerát",
  standalonePageTitle: "Nahlásit inzerát",
  standaloneIntro:
    "Pokud narazíte na inzerát, který porušuje pravidla nebo zákon, dejte nám vědět. Prověříme ho do 24 hodin.",
  successMessage:
    "Děkujeme. Prověříme to do 24 hodin a dáme vám vědět.",
  footerLinkLabel: "Nahlásit inzerát",
  listingUrlLabel: "URL inzerátu",
  reasonLabel: "Důvod nahlášení",
  detailLabel: "Popis (volitelné)",
  emailLabel: "Váš e-mail",
  emailHintLoggedIn: "Volitelné — pro případné upřesnění.",
  emailHintGuest: "Povinné — abychom vám mohli odpovědět.",
  submitLabel: "Odeslat nahlášení",
} as const;

export function getReportReasonLabel(code: string): string {
  return (
    REPORT_REASONS.find((item) => item.code === code)?.label ?? code
  );
}
