import { DeleteAccountSection } from "@/components/account/DeleteAccountSection";
import { ListingQuotaSection } from "@/components/account/ListingQuotaSection";
import { BackHomeLink } from "@/components/navigation/BackHomeLink";
import { getCurrentUser } from "@/lib/auth/get-user";
import {
  getListingUpsellPackage,
  getUserListingQuota,
} from "@/lib/listings/quota";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Nastavení účtu | HobbyUserMarket",
};

type ProfileSettingsPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function ProfileSettingsPage({
  searchParams,
}: ProfileSettingsPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/profil/nastaveni");
  }

  if (user.needsNicknameSetup) {
    redirect("/onboarding?next=/profil/nastaveni");
  }

  const { error } = await searchParams;
  const [quota, upsellPackage] = await Promise.all([
    getUserListingQuota(user.id),
    getListingUpsellPackage(),
  ]);

  return (
    <div className="px-4 py-8 sm:py-10">
      <BackHomeLink />

      <div className="mx-auto max-w-xl">
        <h1 className="text-2xl font-semibold text-gray-900">Nastavení účtu</h1>
        <p className="mt-2 text-sm text-gray-600">
          Správa profilu a citlivých akcí.
        </p>

        {error === "self_delete_admin" ? (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Vlastní admin účet smažte zde v sekci níže, ne z God Mode.
          </p>
        ) : null}

        <section className="mt-8 space-y-4 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900">Profil</h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="font-medium text-gray-500">Přezdívka</dt>
              <dd className="text-gray-900">{user.nickname}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-500">E-mail</dt>
              <dd className="text-gray-900">{user.email}</dd>
            </div>
          </dl>
          <p className="text-xs text-gray-500">
            E-mail nelze změnit — při potřebě jiné adresy smažte účet a založte
            nový.
          </p>
          <Link
            href="/moje-inzeraty"
            className="inline-flex text-sm font-medium text-gray-900 underline-offset-2 hover:underline"
          >
            Správa inzerátů →
          </Link>
        </section>

        {quota ? (
          <ListingQuotaSection quota={quota} upsellPackage={upsellPackage} />
        ) : null}

        <div className="mt-6">
          <DeleteAccountSection email={user.email} />
        </div>
      </div>
    </div>
  );
}
