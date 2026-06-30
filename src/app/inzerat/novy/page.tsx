import { CreateListingForm } from "@/components/listing/CreateListingForm";
import { BackHomeLink } from "@/components/navigation/BackHomeLink";
import { getCurrentUser } from "@/lib/auth/get-user";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Založit inzerát | HobbyUserMarket",
};

export default async function NewListingPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/inzerat/novy&message=create_listing&tab=register");
  }

  if (user.needsNicknameSetup) {
    redirect("/onboarding?next=/inzerat/novy");
  }

  return (
    <div className="px-4 py-8 sm:px-6">
      <div className="mb-6">
        <BackHomeLink />

        <h1 className="mt-4 text-2xl font-semibold text-gray-900">
          Založit inzerát
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Vyplň kategorii a obsah. Platnost 30 dní (u akcí podle data konání).
        </p>
      </div>

      <CreateListingForm userEmail={user.email} />
    </div>
  );
}
