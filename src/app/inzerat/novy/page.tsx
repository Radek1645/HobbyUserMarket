import { CreateListingForm } from "@/components/listing/CreateListingForm";
import { GTM_CTA, gtmCtaProps } from "@/config/gtm-ids";
import { getCurrentUser } from "@/lib/auth/get-user";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Založit inzerát | HobbyUserMarket",
};

export default async function NewListingPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/inzerat/novy");
  }

  return (
    <div className="px-4 py-8 sm:px-6">
      <div className="mb-6">
        <Link
          href="/"
          {...gtmCtaProps(GTM_CTA.CREATE_BACK_HOME)}
          className="text-sm text-gray-500 hover:text-gray-800"
        >
          ← Zpět na úvod
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-gray-900">
          Založit inzerát
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Vyplň kategorii a obsah. Platnost 30 dní (u akcí podle data konání).
        </p>
      </div>

      <CreateListingForm />
    </div>
  );
}
