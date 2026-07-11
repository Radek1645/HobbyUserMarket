import { submitStandaloneReport } from "@/app/actions/moderation-listings";
import { BackHomeLink } from "@/components/navigation/BackHomeLink";
import {
  REPORT_DETAIL_MAX_LENGTH,
  REPORT_REASONS,
  REPORT_UI,
} from "@/config/reports";
import { emeraldPrimaryButtonCompactClass } from "@/config/ui-primitives";
import { getCurrentUser } from "@/lib/auth/get-user";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nahlásit inzerát | HobbyUserMarket",
};

const ERROR_MESSAGES: Record<string, string> = {
  invalid_report_reason: "Vyberte platný důvod nahlášení.",
  missing_email: "Pro nepřihlášené uživatele je e-mail povinný.",
  invalid_email: "Zadejte platný e-mail.",
  report_target_unavailable: "Inzerát nebyl nalezen nebo není aktivní.",
  cannot_report_own_listing: "Vlastní inzerát nelze nahlásit.",
  already_reported: "Tento inzerát jste už nahlásili.",
  report_failed: "Nahlášení se nepodařilo odeslat. Zkuste to prosím znovu.",
  service_unavailable: "Služba je dočasně nedostupná.",
};

type NahlasitPageProps = {
  searchParams: Promise<{
    error?: string;
    submitted?: string;
    url?: string;
  }>;
};

export default async function NahlasitPage({ searchParams }: NahlasitPageProps) {
  const user = await getCurrentUser();
  const { error, submitted, url } = await searchParams;

  const errorMessage = error
    ? (ERROR_MESSAGES[error] ?? decodeURIComponent(error))
    : undefined;

  return (
    <div className="px-4 py-8 sm:py-10">
      <BackHomeLink />

      <div className="mx-auto max-w-lg">
        <h1 className="text-2xl font-semibold text-gray-900">
          {REPORT_UI.standalonePageTitle}
        </h1>
        <p className="mt-2 text-sm text-gray-600">{REPORT_UI.standaloneIntro}</p>

        {submitted === "1" ? (
          <p
            className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
            role="status"
          >
            {REPORT_UI.successMessage}
          </p>
        ) : null}

        {errorMessage ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {errorMessage}
          </p>
        ) : null}

        {submitted !== "1" ? (
          <form action={submitStandaloneReport} className="mt-6 space-y-4">
            <label className="block text-sm">
              <span className="font-medium text-gray-700">
                {REPORT_UI.listingUrlLabel}
              </span>
              <input
                type="url"
                name="listingUrl"
                required
                defaultValue={url ?? ""}
                placeholder="https://…/inzerat/nazev-inzeratu"
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
              />
            </label>

            <label className="block text-sm">
              <span className="font-medium text-gray-700">
                {REPORT_UI.reasonLabel}
              </span>
              <select
                name="reason"
                required
                defaultValue=""
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
              >
                <option value="" disabled>
                  Vyberte důvod…
                </option>
                {REPORT_REASONS.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="font-medium text-gray-700">
                {REPORT_UI.detailLabel}
              </span>
              <textarea
                name="detailText"
                rows={4}
                maxLength={REPORT_DETAIL_MAX_LENGTH}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
              />
            </label>

            <label className="block text-sm">
              <span className="font-medium text-gray-700">
                {REPORT_UI.emailLabel}
                {!user ? " *" : ""}
              </span>
              <input
                type="email"
                name="reporterEmail"
                required={!user}
                defaultValue={user?.email ?? ""}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
              />
              <span className="mt-1 block text-xs text-gray-500">
                {user
                  ? REPORT_UI.emailHintLoggedIn
                  : REPORT_UI.emailHintGuest}
              </span>
            </label>

            <button
              type="submit"
              className={`${emeraldPrimaryButtonCompactClass} w-full sm:w-auto`}
            >
              {REPORT_UI.submitLabel}
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
