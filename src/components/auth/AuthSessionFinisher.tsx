"use client";

import {
  exchangeAuthCodeForSession,
  resolveClientAuthLandingPath,
} from "@/app/actions/auth";
import { ConfirmEmailPanel } from "@/components/auth/ConfirmEmailPanel";
import { parseEmailOtpType } from "@/lib/auth/email-otp-types";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type AuthSessionFinisherProps = {
  code: string | null;
  tokenHash: string | null;
  otpTypeRaw: string | null;
  nextPath: string;
};

type Status = "working" | "confirm_button" | "error";

/**
 * Dokončí session z e-mailového odkazu:
 * - `?code=` (PKCE) přes server action
 * - `#access_token=` (implicit / starší resend) v prohlížeči
 * - `?token_hash=` → tlačítko (prefetch-safe)
 */
export function AuthSessionFinisher({
  code,
  tokenHash,
  otpTypeRaw,
  nextPath,
}: AuthSessionFinisherProps) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>(() => {
    if (tokenHash && parseEmailOtpType(otpTypeRaw) && !code) {
      return "confirm_button";
    }
    return "working";
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "confirm_button") {
      return;
    }

    let cancelled = false;

    async function finish() {
      if (code) {
        const result = await exchangeAuthCodeForSession(code, nextPath);
        if (cancelled) return;
        if (result.error || !result.redirectTo) {
          setError(
            result.error ??
              "Ověření e-mailu se nezdařilo. Požádejte o nový odkaz (Poslat znovu).",
          );
          setStatus("error");
          return;
        }
        router.replace(result.redirectTo);
        router.refresh();
        return;
      }

      const hashParams = new URLSearchParams(
        window.location.hash.startsWith("#")
          ? window.location.hash.slice(1)
          : window.location.hash,
      );
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (accessToken && refreshToken) {
        const supabase = createClient();
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (cancelled) return;
        if (sessionError) {
          setError(
            "Odkaz pro ověření e-mailu je neplatný nebo už byl použit. Požádejte o nový (Poslat znovu).",
          );
          setStatus("error");
          return;
        }
        window.history.replaceState(
          null,
          "",
          `${window.location.pathname}${window.location.search}`,
        );
        const landing = await resolveClientAuthLandingPath(nextPath);
        if (cancelled) return;
        router.replace(landing);
        router.refresh();
        return;
      }

      if (cancelled) return;
      setError(
        "Odkaz pro ověření e-mailu je neplatný nebo už byl použit. Pokud jste mačkali „Poslat znovu“, otevřete nejnovější e-mail (starší odkaz nefunguje). Zkontrolujte i spam.",
      );
      setStatus("error");
    }

    void finish();

    return () => {
      cancelled = true;
    };
  }, [code, nextPath, router, status]);

  const otpType = parseEmailOtpType(otpTypeRaw);

  if (status === "confirm_button" && tokenHash && otpType) {
    return (
      <ConfirmEmailPanel
        tokenHash={tokenHash}
        otpType={otpType}
        nextPath={nextPath}
      />
    );
  }

  if (status === "error") {
    return (
      <div className="space-y-4 text-center">
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </p>
        <a
          href="/login?tab=register"
          className="inline-flex text-sm font-medium text-emerald-700 underline-offset-2 hover:underline"
        >
          Zpět na registraci
        </a>
      </div>
    );
  }

  return (
    <p className="text-center text-sm text-gray-600" role="status">
      Ověřuji e-mail…
    </p>
  );
}
