import { ModListingActions } from "@/components/mod/ModListingActions";
import { BackHomeLink } from "@/components/navigation/BackHomeLink";
import { getCurrentUser } from "@/lib/auth/get-user";
import { isStaffRole } from "@/lib/auth/is-staff-role";
import { loadModListings } from "@/lib/mod/get-mod-listings";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Inzeráty | God Mode",
};

const STATUSES = [
  { value: "", label: "Vše kromě konceptů" },
  { value: "active", label: "Aktivní" },
  { value: "blocked", label: "Zablokované" },
  { value: "hidden", label: "Pauza" },
  { value: "archived", label: "Archiv" },
  { value: "deleted", label: "Smazané" },
];

type InzeratyPageProps = {
  searchParams: Promise<{ status?: string; error?: string }>;
};

export default async function ModInzeratyPage({
  searchParams,
}: InzeratyPageProps) {
  const user = await getCurrentUser();
  if (!user || !isStaffRole(user.role)) {
    redirect("/");
  }

  const { status, error } = await searchParams;
  const listings = await loadModListings({
    status: status || null,
  });

  return (
    <div className="px-4 py-8 sm:py-10">
      <BackHomeLink label="Zpět" />

      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-semibold text-gray-900">
          Všechny inzeráty
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Přehled inzerátů mimo koncepty — max. 100 nejnovějších.
        </p>

        {error ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {decodeURIComponent(error)}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-2">
          {STATUSES.map((item) => {
            const href = item.value
              ? `/mod/inzeraty?status=${item.value}`
              : "/mod/inzeraty";
            const active = (status ?? "") === item.value;
            return (
              <Link
                key={item.value || "all"}
                href={href}
                className={
                  active
                    ? "rounded-full bg-gray-900 px-3 py-1 text-xs font-medium text-white"
                    : "rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="mt-4 overflow-x-auto rounded-2xl border border-gray-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Název</th>
                <th className="px-4 py-3 font-medium">Stav</th>
                <th className="px-4 py-3 font-medium">Nahlášení</th>
                <th className="px-4 py-3 font-medium">Aktualizováno</th>
                <th className="px-4 py-3 font-medium">Akce</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {listings.map((listing) => (
                <tr key={listing.id} className="text-gray-800">
                  <td className="px-4 py-3 font-medium">{listing.title}</td>
                  <td className="px-4 py-3 font-mono text-xs">{listing.status}</td>
                  <td className="px-4 py-3">{listing.reportCount}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(listing.updatedAt).toLocaleDateString("cs-CZ")}
                  </td>
                  <td className="px-4 py-3">
                    <ModListingActions
                      listing={listing}
                      returnPath="/mod/inzeraty"
                      compact
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {listings.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-gray-500">
              Žádné inzeráty pro zvolený filtr.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
