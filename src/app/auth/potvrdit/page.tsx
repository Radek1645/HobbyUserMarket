import { ConfirmEmailPanel } from "@/components/auth/ConfirmEmailPanel";
import { BackLink } from "@/components/navigation/BackLink";
import { SITE_DISPLAY_NAME } from "@/config/site";
import { parseEmailOtpType } from "@/lib/auth/email-otp-types";
import { sanitizeInternalPath } from "@/lib/auth/sanitize-internal-path";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: `Potvrzení e-mailu | ${SITE_DISPLAY_NAME}`,
};

type ConfirmEmailPageProps = {
  searchParams: Promise<{
    token_hash?: string;
    type?: string;
    next?: string;
  }>;
};

export default async function ConfirmEmailPage({
  searchParams,
}: ConfirmEmailPageProps) {
  const params = await searchParams;
  const tokenHash = params.token_hash?.trim() ?? "";
  const otpType = parseEmailOtpType(params.type);
  const nextPath = sanitizeInternalPath(params.next);

  const canConfirm = Boolean(tokenHash && otpType);

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-center text-2xl font-semibold text-gray-900">
          Potvrzení e-mailu
        </h1>

        <div className="mt-6">
          {canConfirm && otpType ? (
            <ConfirmEmailPanel
              tokenHash={tokenHash}
              otpType={otpType}
              nextPath={nextPath}
            />
          ) : (
            <div className="space-y-4 text-center">
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                Odkaz pro potvrzení e-mailu je neúplný nebo neplatný.
              </p>
              <p className="text-sm text-gray-600">
                Požádejte o nový ověřovací e-mail na stránce registrace
                (tlačítko „Poslat znovu“).
              </p>
              <Link
                href="/login?tab=register"
                className="inline-flex text-sm font-medium text-emerald-700 underline-offset-2 hover:underline"
              >
                Přejít na registraci
              </Link>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-center">
          <BackLink href="/login" label="Zpět na přihlášení" />
        </div>
      </div>
    </div>
  );
}
