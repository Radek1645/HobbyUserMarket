import {
  AUTH_SESSION_FINISH_PATH,
  EMAIL_SIGNUP_CONFIRM_PATH,
} from "@/config/auth";
import { sanitizeInternalPath } from "@/lib/auth/sanitize-internal-path";
import { getSiteUrl } from "@/lib/supabase/env";

function buildAuthEmailRedirectUrl(path: string, nextPath: string): string {
  const safeNext = sanitizeInternalPath(nextPath);
  return `${getSiteUrl()}${path}?next=${encodeURIComponent(safeNext)}`;
}

/** `emailRedirectTo` po registraci / resendu — šablona doplní `token_hash`. */
export function buildSignupConfirmRedirectUrl(nextPath: string): string {
  return buildAuthEmailRedirectUrl(EMAIL_SIGNUP_CONFIRM_PATH, nextPath);
}

/** Obnova hesla — `next` musí zůstat `/auth/nastavit-heslo`. */
export function buildPasswordRecoveryRedirectUrl(): string {
  return buildAuthEmailRedirectUrl(
    AUTH_SESSION_FINISH_PATH,
    "/auth/nastavit-heslo",
  );
}
