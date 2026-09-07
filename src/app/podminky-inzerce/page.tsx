import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";
import { MODERATION_REJECTION_UI } from "@/config/moderation";
import { SITE_DISPLAY_NAME } from "@/config/site";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `${MODERATION_REJECTION_UI.termsLinkLabel} | ${SITE_DISPLAY_NAME}`,
};

export default function ListingTermsPage() {
  return <LegalDocumentPage slug="podminky-inzerce" />;
}
