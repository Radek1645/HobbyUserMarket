import { OnboardingForm } from "@/components/auth/OnboardingForm";
import { getCurrentUser } from "@/lib/auth/get-user";
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
  const nextPath = next?.startsWith("/") && !next.startsWith("/onboarding") ? next : "/";

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-center text-2xl font-semibold text-gray-900">
          Vítej na HobbyUserMarket
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          Doplň profil — přezdívku nebo firemní údaje uvidí sousedé u tvých
          inzerátů.
        </p>

        <div className="mt-6">
          <OnboardingForm nextPath={nextPath} email={user.email} />
        </div>
      </div>
    </div>
  );
}
