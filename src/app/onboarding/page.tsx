import { OnboardingForm } from "@/components/auth/OnboardingForm";
import { getCurrentUser } from "@/lib/auth/get-user";
import { userRequiresRegistrationConsentsOnboarding } from "@/lib/auth/registration-consents";
import { sanitizeInternalPath } from "@/lib/auth/sanitize-internal-path";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Nastavení přezdívky | HobbyUserMarket",
};

type OnboardingPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/onboarding");
  }

  if (!user.needsNicknameSetup) {
    redirect("/");
  }

  const { next } = await searchParams;
  const sanitized = sanitizeInternalPath(next);
  const nextPath = sanitized.startsWith("/onboarding") ? "/" : sanitized;

  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  const requiresRegistrationConsents =
    userRequiresRegistrationConsentsOnboarding(authUser);

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-center text-2xl font-semibold text-gray-900">
          Vítejte na HobbyUserMarket
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          {requiresRegistrationConsents
            ? "Doplňte profil a potvrďte souhlasy — pak můžete inzerovat."
            : "Doplňte profil — u inzerátů se zobrazí přezdívka nebo název firmy."}
        </p>

        <div className="mt-6">
          <OnboardingForm
            nextPath={nextPath}
            email={user.email}
            requiresRegistrationConsents={requiresRegistrationConsents}
          />
        </div>
      </div>
    </div>
  );
}
