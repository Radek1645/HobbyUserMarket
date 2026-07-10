import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Všeobecné obchodní podmínky | HobbyUserMarket",
};

export default function VopPage() {
  return <LegalDocumentPage slug="vop" />;
}
