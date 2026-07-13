import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";
import { LEGAL_UI } from "@/config/legal";
import { SITE_DISPLAY_NAME } from "@/config/site";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `${LEGAL_UI.cookiesLinkLabel} | ${SITE_DISPLAY_NAME}`,
};

export default function CookiesPage() {
  return <LegalDocumentPage slug="cookies" />;
}
