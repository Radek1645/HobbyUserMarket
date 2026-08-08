import { EmailAuthPanel } from "@/components/auth/EmailAuthPanel";
import { LISTING_QUOTA_FREE_DEFAULT } from "@/config/app";
import { getCurrentUser } from "@/lib/auth/get-user";
import { mapAuthError } from "@/lib/auth/map-auth-error";
import { sanitizeInternalPath } from "@/lib/auth/sanitize-internal-path";
import { redirect } from "next/navigation";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
    next?: string;
    tab?: string;
  }>;
};

function resolveInitialTab(tab?: string): "login" | "register" | "forgot" {
  if (tab === "register" || tab === "forgot") {
    return tab;
  }
  return "login";
}

const messageMap: Record<string, string> = {
  password_updated: "Heslo bylo nastavené. Můžete se přihlásit.",
  account_deleted: "Účet byl smazán. Můžete se kdykoli znovu registrovat.",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error: errorParam, message, next, tab } = await searchParams;
  const nextPath = sanitizeInternalPath(next);
  const user = await getCurrentUser();

  if (user) {
    if (user.needsNicknameSetup) {
      const onboardingNext =
        nextPath !== "/" && !nextPath.startsWith("/onboarding")
          ? `?next=${encodeURIComponent(nextPath)}`
          : "";
      redirect(`/onboarding${onboardingNext}`);
    }
    redirect(nextPath.startsWith("/login") ? "/" : nextPath);
  }

  const infoMessage = message ? messageMap[message] : undefined;
  const isCreateListingFlow = message === "create_listing";
  const error = errorParam ? mapAuthError(errorParam) : undefined;

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-4 py-10 sm:py-12">
      <div
        className={
          isCreateListingFlow
            ? "w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 shadow-md sm:max-w-lg sm:p-10 lg:max-w-xl lg:p-12"
            : "w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
        }
      >
        <h1
          className={`text-center font-semibold text-gray-900 ${
            isCreateListingFlow ? "text-2xl sm:text-3xl" : "text-2xl"
          }`}
        >
          {isCreateListingFlow ? "Založit inzerát" : "Přihlášení"}
        </h1>

        {isCreateListingFlow ? (
          <>
            <div
              className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-center sm:mt-6 sm:px-5 sm:py-5"
              role="status"
            >
              <p className="text-base font-semibold leading-snug text-emerald-950 sm:text-lg">
                Nejdřív si založte profil nebo se přihlaste.
              </p>
              <p className="mt-2 text-sm font-medium text-emerald-900 sm:text-base">
                Startujete s {LISTING_QUOTA_FREE_DEFAULT} inzeráty zdarma!
              </p>
            </div>
            <p className="mt-3 text-center text-sm leading-relaxed text-gray-600 sm:text-base">
              Bez účtu inzerát nezveřejníte. Pak můžete nabízet zboží nebo služby
              v okolí.
            </p>
          </>
        ) : (
          <p className="mt-2 text-center text-sm text-gray-600">
            Přihlaste se e-mailem nebo přes Google a začněte prodávat nebo nakupovat
            lokálně.
          </p>
        )}

        {infoMessage ? (
          <p
            className="mt-4 rounded-lg bg-sky-50 px-3 py-2 text-center text-sm text-sky-900"
            role="status"
          >
            {infoMessage}
          </p>
        ) : null}

        {error ? (
          <p
            className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-700"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <EmailAuthPanel
          nextPath={nextPath}
          initialTab={resolveInitialTab(tab)}
          prominent={isCreateListingFlow}
        />
      </div>
    </div>
  );
}
