import { signInWithGoogle } from "@/app/actions/auth";
import { EmailAuthPanel } from "@/components/auth/EmailAuthPanel";
import { GTM_CTA, gtmCtaProps } from "@/config/gtm-ids";
import { getCurrentUser } from "@/lib/auth/get-user";
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
  password_updated: "Heslo bylo nastavené. Můžeš se přihlásit.",
  create_listing:
    "Nejdřív si založ profil — pak můžeš přidat inzerát a nabízet zboží nebo služby v okolí.",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getCurrentUser();

  if (user) {
    if (user.needsNicknameSetup) {
      redirect("/onboarding");
    }
    redirect("/");
  }

  const { error, message, next, tab } = await searchParams;
  const nextPath = next?.startsWith("/") ? next : "/";
  const infoMessage = message ? messageMap[message] : undefined;
  const isCreateListingFlow = message === "create_listing";

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-center text-2xl font-semibold text-gray-900">
          {isCreateListingFlow ? "Založit inzerát" : "Přihlášení"}
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          {isCreateListingFlow
            ? "Přihlas se nebo si vytvoř účet. Bez profilu inzerát nezveřejníš."
            : "Přihlas se e-mailem nebo přes Google a začni prodávat nebo nakupovat lokálně."}
        </p>

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

        <EmailAuthPanel nextPath={nextPath} initialTab={resolveInitialTab(tab)} />

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-500">nebo</span>
          </div>
        </div>

        <form action={signInWithGoogle.bind(null, nextPath)}>
          <button
            type="submit"
            {...gtmCtaProps(GTM_CTA.LOGIN_GOOGLE)}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 transition hover:bg-gray-50"
          >
            <GoogleIcon />
            Pokračovat přes Google
          </button>
        </form>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
