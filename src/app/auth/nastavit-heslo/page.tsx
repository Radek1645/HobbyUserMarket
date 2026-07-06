import { SetPasswordForm } from "@/components/auth/SetPasswordForm";
import { BackLink } from "@/components/navigation/BackLink";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Nové heslo | HobbyUserMarket",
};

export default async function SetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?tab=forgot");
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-center text-2xl font-semibold text-gray-900">
          Nové heslo
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          Zadejte nové heslo k účtu {user.email}.
        </p>

        <div className="mt-6">
          <SetPasswordForm />
        </div>

        <div className="mt-4 flex justify-center">
          <BackLink href="/login" label="Zpět na přihlášení" />
        </div>
      </div>
    </div>
  );
}
