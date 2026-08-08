import { OnboardingForm } from "@/components/auth/OnboardingForm";
import { SITE_DISPLAY_NAME, SITE_SHORT_NAME } from "@/config/site";
import { signOut } from "@/app/actions/auth";
import { getCurrentUser } from "@/lib/auth/get-user";
import { userRequiresRegistrationConsentsOnboarding } from "@/lib/auth/registration-consents";
import { sanitizeInternalPath } from "@/lib/auth/sanitize-internal-path";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: `Nastavení přezdívky | ${SITE_DISPLAY_NAME}`,
};

type OnboardingPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/onboarding");
  }

  const { next } = await searchParams;
  const sanitized = sanitizeInternalPath(next);
  const nextPath = sanitized.startsWith("/onboarding") ? "/" : sanitized;

  if (!user.needsNicknameSetup) {
    redirect(nextPath !== "/" ? nextPath : "/");
  }

  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  const { data: consentProfile } = await supabase
    .from("profiles")
    .select("age_confirmed_at")
    .eq("id", user.id)
    .maybeSingle<{ age_confirmed_at: string | null }>();

  const requiresRegistrationConsents =
    userRequiresRegistrationConsentsOnboarding(authUser) &&
    !consentProfile?.age_confirmed_at;

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-center text-2xl font-semibold text-gray-900">
          Vítejte na {SITE_SHORT_NAME}
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

        <div className="mt-6 flex flex-col items-center gap-2 text-sm text-gray-600">
          <Link
            href="/"
            className="font-medium text-gray-800 underline-offset-2 hover:text-gray-900 hover:underline"
          >
            Zpět na úvodní stránku
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="text-gray-500 underline-offset-2 hover:text-gray-800 hover:underline"
            >
              Odhlásit se
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
