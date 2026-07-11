import { ModHiddenCommentsTable } from "@/components/mod/ModHiddenCommentsTable";
import { ModListingActions } from "@/components/mod/ModListingActions";
import { BackHomeLink } from "@/components/navigation/BackHomeLink";
import { getPostStatusReasonMessage } from "@/config/listing-status-reasons";
import { getCurrentUser } from "@/lib/auth/get-user";
import { isStaffRole } from "@/lib/auth/is-staff-role";
import {
  loadBlockedListings,
  loadHiddenComments,
} from "@/lib/mod/get-mod-listings";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Karanténa | God Mode",
};

const ERROR_MESSAGES: Record<string, string> = {
  invalid_post: "Neplatný inzerát.",
  post_not_found: "Inzerát nebyl nalezen.",
  post_already_restricted: "Inzerát je už zablokovaný.",
  post_not_blocked: "Inzerát není ve stavu blocked.",
  block_failed: "Zablokování se nepodařilo.",
  delete_failed: "Smazání se nepodařilo.",
  restore_failed: "Obnovení se nepodařilo.",
  invalid_comment: "Neplatný komentář.",
};

type KarantenaPageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function ModKarantenaPage({
  searchParams,
}: KarantenaPageProps) {
  const user = await getCurrentUser();
  if (!user || !isStaffRole(user.role)) {
    redirect("/");
  }

  const params = await searchParams;
  const listings = await loadBlockedListings();
  const comments = await loadHiddenComments();

  const errorMessage = params.error
    ? (ERROR_MESSAGES[params.error] ?? decodeURIComponent(params.error))
    : undefined;

  return (
    <div className="px-4 py-8 sm:py-10">
      <BackHomeLink label="Zpět" />

      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-semibold text-gray-900">Karanténa</h1>
        <p className="mt-2 text-sm text-gray-600">
          Zablokované inzeráty a skryté komentáře čekající na rozhodnutí.
        </p>

        {params.listing_blocked === "1" ? (
          <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            Inzerát byl zablokován.
          </p>
        ) : null}
        {params.listing_deleted === "1" ? (
          <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            Inzerát byl smazán.
          </p>
        ) : null}
        {params.listing_restored === "1" ? (
          <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            Inzerát byl obnoven.
          </p>
        ) : null}
        {params.comment_restored === "1" ? (
          <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            Komentář byl obnoven.
          </p>
        ) : null}
        {errorMessage ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {errorMessage}
          </p>
        ) : null}

        <h2 className="mt-8 text-lg font-semibold text-gray-900">
          Inzeráty ({listings.length})
        </h2>

        <div className="mt-4 overflow-x-auto rounded-2xl border border-gray-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Název</th>
                <th className="px-4 py-3 font-medium">Důvod</th>
                <th className="px-4 py-3 font-medium">Nahlášení</th>
                <th className="px-4 py-3 font-medium">Aktualizováno</th>
                <th className="px-4 py-3 font-medium">Akce</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {listings.map((listing) => (
                <tr key={listing.id} className="text-gray-800">
                  <td className="px-4 py-3 font-medium">{listing.title}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {getPostStatusReasonMessage(listing.statusReasonCode) ??
                      "—"}
                  </td>
                  <td className="px-4 py-3">{listing.reportCount}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(listing.updatedAt).toLocaleDateString("cs-CZ")}
                  </td>
                  <td className="px-4 py-3">
                    <ModListingActions
                      listing={listing}
                      returnPath="/mod/karantena"
                      compact
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {listings.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-gray-500">
              Karanténa je prázdná.
            </p>
          ) : null}
        </div>

        <h2 className="mt-10 text-lg font-semibold text-gray-900">
          Komentáře
        </h2>
        <ModHiddenCommentsTable comments={comments} />
      </div>
    </div>
  );
}
