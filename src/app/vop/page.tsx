import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";
import { SITE_DISPLAY_NAME } from "@/config/site";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `Všeobecné obchodní podmínky | ${SITE_DISPLAY_NAME}`,
};

export default function VopPage() {
  return <LegalDocumentPage slug="vop" />;
}
