import { getReportReasonLabel } from "@/config/reports";

export type AdminReportEmailParams = {
  listingTitle: string;
  listingUrl: string;
  quarantineUrl: string;
  reason: string;
  source: "inline" | "standalone";
  reportCount: number;
  detailText?: string;
  reporterEmail?: string;
};

export function buildAdminReportEmail(params: AdminReportEmailParams): {
  subject: string;
  text: string;
} {
  const reasonLabel = getReportReasonLabel(params.reason);
  const sourceLabel =
    params.source === "inline" ? "Detail inzerátu" : "Formulář /nahlasit";

  const lines = [
    "Nové nahlášení inzerátu — HobbyUserMarket",
    "",
    `Inzerát: ${params.listingTitle}`,
    `URL: ${params.listingUrl}`,
    `Důvod: ${reasonLabel}`,
    `Zdroj: ${sourceLabel}`,
    `Počet nahlášení (unikátní uživatelé): ${params.reportCount}`,
  ];

  if (params.reporterEmail) {
    lines.push(`E-mail oznamovatele: ${params.reporterEmail}`);
  }

  if (params.detailText?.trim()) {
    lines.push("", "Popis:", params.detailText.trim());
  }

  lines.push("", `Karanténa: ${params.quarantineUrl}`);

  return {
    subject: `[HUM] Nahlášení: ${params.listingTitle}`,
    text: lines.join("\n"),
  };
}
