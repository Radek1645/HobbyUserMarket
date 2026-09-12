"use client";

import { confirmEmailWithTokenHash } from "@/app/actions/auth";
import { emeraldPrimaryButtonClass } from "@/config/ui-primitives";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type ConfirmEmailPanelProps = {
  tokenHash: string;
  otpType: string;
  nextPath: string;
};

export function ConfirmEmailPanel({
  tokenHash,
  otpType,
  nextPath,
}: ConfirmEmailPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await confirmEmailWithTokenHash({
        tokenHash,
        otpType,
        nextPath,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.redirectTo) {
        router.replace(result.redirectTo);
        router.refresh();
      }
    });
  }

  const loginHref =
    nextPath && nextPath !== "/"
      ? `/login?next=${encodeURIComponent(nextPath)}`
      : "/login";

  return (
    <div className="space-y-4">
      <p className="text-center text-sm text-gray-600">
        Pro dokončení ověření potvrďte e-mail tlačítkem níže. Ověření proběhne
        až po vašem kliknutí — odolá automatickému načtení odkazu některými
        schránkami.
      </p>

      {error ? (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={handleConfirm}
        disabled={pending}
        className={`flex w-full items-center justify-center px-4 py-3 text-sm ${emeraldPrimaryButtonClass} disabled:cursor-not-allowed disabled:opacity-50`}
      >
        {pending ? "Ověřuji…" : "Potvrdit e-mail"}
      </button>

      <p className="text-center text-xs text-gray-500">
        Neplatný nebo vypršelý odkaz? Pokud účet už máte,{" "}
        <Link
          href={loginHref}
          className="font-medium text-emerald-700 underline-offset-2 hover:underline"
        >
          přihlaste se
        </Link>
        . Jinak na registraci použijte „Poslat znovu“ — předchozí odkaz se tím
        zneplatní.
      </p>
    </div>
  );
}
