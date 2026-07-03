import { MODERATION_REJECTION_UI } from "@/config/moderation";
import { BackHomeLink } from "@/components/navigation/BackHomeLink";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `${MODERATION_REJECTION_UI.termsLinkLabel} | HobbyUserMarket`,
};

export default function ListingTermsPage() {
  return (
    <div className="px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-semibold text-gray-900">
        {MODERATION_REJECTION_UI.termsLinkLabel}
      </h1>
      <p className="mt-3 text-gray-600">
        Tato stránka se připravuje. Brzy zde najdeš kompletní pravidla pro
        vkládání inzerátů na HobbyUserMarket — co je povoleno, co zakázáno a
        jak probíhá moderace obsahu.
      </p>
      <p className="mt-4 text-sm text-gray-500">
        Mezitím platí základní pravidlo: žádný nelegální obsah, podvody, sexuální
        služby, drogy, zbraně ani jiné zakázané kategorie uvedené při zamítnutí
        inzerátu.
      </p>
      <BackHomeLink className="mt-6" />
    </div>
  );
}
