import { AuthSessionFinisher } from "@/components/auth/AuthSessionFinisher";
import { BackLink } from "@/components/navigation/BackLink";
import { SITE_DISPLAY_NAME } from "@/config/site";
import { sanitizeInternalPath } from "@/lib/auth/sanitize-internal-path";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `Potvrzení e-mailu | ${SITE_DISPLAY_NAME}`,
};

type ConfirmEmailPageProps = {
  searchParams: Promise<{
    code?: string;
    token_hash?: string;
    type?: string;
    next?: string;
  }>;
};

/**
 * Cíl `emailRedirectTo` po ověření e-mailu.
 * Preferuje `token_hash` + tlačítko (prefetch-safe, bez cookie z registrace).
 * PKCE `?code=` a implicit `#access_token=` jsou fallback, dokud šablona
 * v Supabase dashboardu nepoužívá `{{ .TokenHash }}`.
 */
export default async function ConfirmEmailPage({
  searchParams,
}: ConfirmEmailPageProps) {
  const params = await searchParams;
  const nextPath = sanitizeInternalPath(params.next);

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-center text-2xl font-semibold text-gray-900">
          Potvrzení e-mailu
        </h1>
        <div className="mt-6">
          <AuthSessionFinisher
            code={params.code?.trim() || null}
            tokenHash={params.token_hash?.trim() || null}
            otpTypeRaw={params.type ?? null}
            nextPath={nextPath}
          />
        </div>
        <div className="mt-6 flex justify-center">
          <BackLink href="/login" label="Zpět na přihlášení" />
        </div>
      </div>
    </div>
  );
}
