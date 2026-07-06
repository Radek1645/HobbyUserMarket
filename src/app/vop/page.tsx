import { BackHomeLink } from "@/components/navigation/BackHomeLink";
import { LEGAL_UI } from "@/config/legal";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `${LEGAL_UI.vopLinkLabel} | HobbyUserMarket`,
};

export default function VopPage() {
  return (
    <div className="px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-semibold text-gray-900">
        {LEGAL_UI.vopLinkLabel}
      </h1>
      <p className="mt-3 text-gray-600">
        Tato stránka se připravuje. Brzy zde najdete kompletní všeobecné
        obchodní podmínky platformy HobbyUserMarket — vztah mezi vámi a námi,
        práva a povinnosti uživatelů a pravidla používání služby.
      </p>
      <p className="mt-4 text-sm text-gray-500">
        Mezitím platí základní pravidlo: používejte platformu v souladu se
        zákonem a s ohledem na ostatní uživatele.
      </p>
      <BackHomeLink className="mt-6" />
    </div>
  );
}
