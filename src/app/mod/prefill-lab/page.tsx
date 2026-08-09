import { PrefillCompareLab } from "@/components/mod/PrefillCompareLab";
import { BackHomeLink } from "@/components/navigation/BackHomeLink";
import { COMPARE_SUGGEST_UI } from "@/config/compare-suggest-from-photos";
import { getCurrentUser } from "@/lib/auth/get-user";
import { isStaffRole } from "@/lib/auth/is-staff-role";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Prefill lab | God Mode",
  robots: { index: false, follow: false },
};

export default async function ModPrefillLabPage() {
  const user = await getCurrentUser();
  if (!user || !isStaffRole(user.role)) {
    redirect("/");
  }

  return (
    <div className="px-4 py-8 sm:py-10">
      <BackHomeLink label="Zpět" />

      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-semibold text-gray-900">
          {COMPARE_SUGGEST_UI.pageTitle}
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          {COMPARE_SUGGEST_UI.pageSubtitle}
        </p>

        <div className="mt-8">
          <PrefillCompareLab />
        </div>
      </div>
    </div>
  );
}
