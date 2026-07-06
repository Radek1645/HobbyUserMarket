import { BackHomeLink } from "@/components/navigation/BackHomeLink";
import { LEGAL_UI } from "@/config/legal";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `${LEGAL_UI.marketingConsentLinkLabel} | HobbyUserMarket`,
};

export default function MarketingConsentPage() {
  return (
    <div className="px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-semibold text-gray-900">
        {LEGAL_UI.marketingConsentLinkLabel}
      </h1>
      <p className="mt-3 text-gray-600">
        Tato stránka se připravuje. Brzy zde najdete podrobnosti o tom, jaké
        marketingové sdělení vám můžeme zasílat, na jakém právním základě a jak
        souhlas kdykoli odvolat.
      </p>
      <p className="mt-4 text-sm text-gray-500">
        Marketingový souhlas není povinný pro založení účtu ani pro používání
        platformy.
      </p>
      <BackHomeLink className="mt-6" />
    </div>
  );
}
