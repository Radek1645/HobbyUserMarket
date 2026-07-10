import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Balíčky inzerce | HobbyUserMarket",
};

export default function ListingPackagesPage() {
  return <LegalDocumentPage slug="balicky-inzerce" />;
}
