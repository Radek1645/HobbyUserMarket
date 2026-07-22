import {
  adminAddToBlacklist,
  adminRemoveFromBlacklist,
  loadAccountBlacklist,
} from "@/app/actions/account-blacklist";
import { BackHomeLink } from "@/components/navigation/BackHomeLink";
import { ACCOUNT_BLACKLIST_SOURCE } from "@/config/account-blacklist";
import { getCurrentUser } from "@/lib/auth/get-user";
import { isStaffRole } from "@/lib/auth/is-staff-role";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Blacklist | God Mode",
};

const ERROR_MESSAGES: Record<string, string> = {
  invalid_email: "Zadejte platný e-mail.",
  missing_reason: "Vyplňte důvod.",
  missing_id: "Chybí identifikátor záznamu.",
  already_listed: "Tento e-mail už je na aktivním blacklistu.",
  not_found: "Záznam nebyl nalezen (nebo už byl odebrán).",
  db_error: "Databázová chyba — zkuste to znovu.",
  admin_client: "Chybí service role klíč na serveru.",
};

const HIDE_ERROR_MESSAGES: Record<string, string> = {
  "42501":
    "DB odmítla UPDATE na posts (service_role). Spusťte migraci 057_service_role_posts_update.sql.",
};

type PageProps = {
  searchParams: Promise<{
    error?: string;
    added?: string;
    removed?: string;
    already?: string;
    hidden?: string;
    restored?: string;
    no_user?: string;
    hide_error?: string;
    historie?: string;
    email_failed?: string;
  }>;
};

export default async function ModBlacklistPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user || !isStaffRole(user.role)) {
    redirect("/");
  }

  const params = await searchParams;
  const showHistory = params.historie === "1";
  const rows = await loadAccountBlacklist({ includeRemoved: showHistory });
  const activeRows = rows.filter((row) => !row.removed_at);
  const displayRows = showHistory ? rows : activeRows;

  const errorMessage = params.error
    ? (ERROR_MESSAGES[params.error] ?? decodeURIComponent(params.error))
    : undefined;

  return (
    <div className="px-4 py-8 sm:py-10">
      <BackHomeLink />

      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-semibold text-gray-900">Blacklist účtů</h1>
        <p className="mt-2 text-sm text-gray-600">
          Hard stop podle e-mailu (automaticky po 3 hard rejectech / 24 h, nebo
          ručně). Odebráním se účet i jeho inzeráty skryté hard stopem znovu
          zpřístupní.
        </p>

        {params.added === "1" ? (
          <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            {params.already === "1"
              ? "E-mail už byl na blacklistu — inzeráty jsme znovu skryli."
              : "E-mail byl přidán na blacklist."}
            {params.hidden != null ? (
              <span className="mt-1 block">
                Skryto inzerátů (active/hidden → blocked): {params.hidden}.
              </span>
            ) : null}
            {params.no_user === "1" ? (
              <span className="mt-1 block text-amber-900">
                Účet s tímto e-mailem v profiles/auth nenalezen — blacklist platí,
                ale žádné inzeráty se neskryly.
              </span>
            ) : null}
            {params.hide_error ? (
              <span className="mt-1 block text-amber-900">
                {HIDE_ERROR_MESSAGES[params.hide_error] ??
                  `Skrytí inzerátů selhalo (kód ${params.hide_error}).`}
              </span>
            ) : null}
            {params.email_failed === "1" ? (
              <span className="mt-1 block text-amber-900">
                Upozornění e-mailem se nepodařilo odeslat — zkontrolujte Resend.
              </span>
            ) : null}
          </p>
        ) : null}
        {params.removed === "1" ? (
          <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            E-mail byl odebrán z blacklistu. Účet i inzeráty skryté hard stopem
            jsou znovu aktivní.
            {params.restored != null ? (
              <span className="mt-1 block">
                Obnoveno inzerátů: {params.restored}.
              </span>
            ) : null}
            {params.email_failed === "1" ? (
              <span className="mt-1 block text-amber-900">
                Potvrzení e-mailem se nepodařilo odeslat — zkontrolujte Resend.
              </span>
            ) : null}
          </p>
        ) : null}
        {errorMessage ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {errorMessage}
          </p>
        ) : null}

        <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-gray-900">
            Přidat e-mail
          </h2>
          <form action={adminAddToBlacklist} className="mt-4 space-y-3">
            <div>
              <label
                htmlFor="blacklist-email"
                className="block text-sm font-medium text-gray-700"
              >
                E-mail
              </label>
              <input
                id="blacklist-email"
                name="email"
                type="email"
                required
                className="mt-1 w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="uzivatel@example.com"
              />
            </div>
            <div>
              <label
                htmlFor="blacklist-reason"
                className="block text-sm font-medium text-gray-700"
              >
                Důvod
              </label>
              <input
                id="blacklist-reason"
                name="reason"
                type="text"
                required
                maxLength={500}
                className="mt-1 w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="např. manuální hard stop po stížnosti"
              />
            </div>
            <button
              type="submit"
              className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
            >
              Přidat na blacklist
            </button>
          </form>
        </section>

        <div className="mt-8 flex flex-wrap items-center gap-3 text-sm">
          <a
            href="/mod/blacklist"
            className={
              !showHistory
                ? "font-semibold text-amber-950"
                : "text-gray-600 underline-offset-2 hover:underline"
            }
          >
            Aktivní ({activeRows.length})
          </a>
          <span className="text-gray-300">|</span>
          <a
            href="/mod/blacklist?historie=1"
            className={
              showHistory
                ? "font-semibold text-amber-950"
                : "text-gray-600 underline-offset-2 hover:underline"
            }
          >
            Historie (vč. odebraných)
          </a>
        </div>

        <div className="mt-4 overflow-x-auto rounded-2xl border border-gray-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">E-mail</th>
                <th className="px-3 py-2">Zdroj</th>
                <th className="px-3 py-2">Důvod</th>
                <th className="px-3 py-2">Od</th>
                <th className="px-3 py-2">Akce</th>
              </tr>
            </thead>
            <tbody>
              {displayRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-6 text-center text-gray-500"
                  >
                    Žádné záznamy.
                  </td>
                </tr>
              ) : (
                displayRows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-gray-100 align-top"
                  >
                    <td className="px-3 py-3 text-gray-500">
                      {row.blacklist_no}
                    </td>
                    <td className="px-3 py-3 font-medium text-gray-900">
                      {row.email}
                      {row.removed_at ? (
                        <span className="mt-1 block text-xs font-normal text-emerald-700">
                          Odebráno{" "}
                          {new Date(row.removed_at).toLocaleString("cs-CZ")}
                          {row.removed_reason
                            ? ` — ${row.removed_reason}`
                            : ""}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-3 text-gray-700">
                      {row.source === ACCOUNT_BLACKLIST_SOURCE.automatic
                        ? "automatika"
                        : "manuál"}
                    </td>
                    <td className="max-w-xs px-3 py-3 text-gray-700">
                      {row.reason}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-gray-600">
                      {new Date(row.created_at).toLocaleString("cs-CZ")}
                    </td>
                    <td className="px-3 py-3">
                      {!row.removed_at ? (
                        <form
                          action={adminRemoveFromBlacklist}
                          className="flex max-w-xs flex-col gap-2"
                        >
                          <input
                            type="hidden"
                            name="blacklistId"
                            value={row.id}
                          />
                          <input
                            name="removedReason"
                            type="text"
                            required
                            maxLength={500}
                            placeholder="Důvod odebrání"
                            className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                          />
                          <button
                            type="submit"
                            className="rounded-lg border border-emerald-300 bg-emerald-50 px-2 py-1.5 text-xs font-medium text-emerald-900 hover:bg-emerald-100"
                          >
                            Odebrat z blacklistu
                          </button>
                        </form>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
