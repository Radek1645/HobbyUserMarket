"use client";

import { confirmEmailWithTokenHash } from "@/app/actions/auth";
import { emeraldPrimaryButtonClass } from "@/config/ui-primitives";
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

  return (
    <div className="space-y-4">
      <p className="text-center text-sm text-gray-600">
        Pro dokončení registrace potvrďte e-mail tlačítkem níže. Ověření proběhne
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
        Neplatný nebo vypršelý odkaz? Zaregistrujte se znovu a použijte „Poslat
        znovu“ — předchozí odkaz se tím zneplatní.
      </p>
    </div>
  );
}
