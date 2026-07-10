import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";
import { MODERATION_REJECTION_UI } from "@/config/moderation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `${MODERATION_REJECTION_UI.termsLinkLabel} | HobbyUserMarket`,
};

export default function ListingTermsPage() {
  return <LegalDocumentPage slug="podminky-inzerce" />;
}
