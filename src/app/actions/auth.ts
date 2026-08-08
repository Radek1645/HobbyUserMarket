"use server";

import {
  generateCompanyNickname,
  isPlaceholderNickname,
  normalizeNickname,
  resolveCompanyInternalNickname,
  validateNickname,
} from "@/lib/auth/nickname";
import { normalizeIco, validateIco } from "@/lib/company/ico";
import { createClient } from "@/lib/supabase/server";
import { isUniqueViolation } from "@/lib/supabase/postgres-errors";
import { storePendingAuthReturnPath } from "@/lib/auth/pending-auth-return-path";
import { getSiteUrl } from "@/lib/supabase/env";
import {
  userRequiresRegistrationConsentsOnboarding,
  validateRegistrationConsents,
} from "@/lib/auth/registration-consents";
import {
  flushPendingRegistrationConsents,
  persistRegistrationConsents,
  profileHasRecordedConsents,
  readRegistrationConsentPayload,
  buildPendingConsentMetadata,
} from "@/lib/auth/persist-registration-consents";
import { storePendingOAuthRegistrationConsents } from "@/lib/auth/oauth-registration-consents";
import { parseEmailOtpType } from "@/lib/auth/email-otp-types";
import { resolvePostAuthNextPath } from "@/lib/auth/finish-auth-redirect";
import { sanitizeInternalPath } from "@/lib/auth/sanitize-internal-path";
import {
  DUPLICATE_EMAIL_MESSAGE,
  mapAuthError,
} from "@/lib/auth/map-auth-error";
import { PENDING_REGISTRATION_METADATA_KEY } from "@/config/meta-pixel";
import { PASSWORD_MIN_LENGTH } from "@/config/app";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type AuthFormState = {
  error?: string;
  success?: string;
  /** E-mail pro opětovné odeslání ověření (U21). */
  email?: string;
};

function isDuplicateEmailSignup(user: { identities?: unknown[] | null } | null): boolean {
  return user != null && (user.identities?.length ?? 0) === 0;
}

function readEmail(formData: FormData): string {
  return String(formData.get("email") ?? "").trim().toLowerCase();
}

function readPassword(formData: FormData): string {
  return String(formData.get("password") ?? "");
}

function readNextPath(formData: FormData): string {
  return sanitizeInternalPath(String(formData.get("next") ?? "/"));
}

async function redirectAfterAuth(nextPath: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("nickname")
    .eq("id", user.id)
    .maybeSingle<{ nickname: string }>();

  revalidatePath("/", "layout");
  revalidatePath("/inzerat/novy");

  if (!profile || isPlaceholderNickname(profile.nickname)) {
    redirect(`/onboarding?next=${encodeURIComponent(nextPath)}`);
  }

  redirect(nextPath);
}

export async function signInWithGoogle(formData: FormData) {
  const safeNextPath = readNextPath(formData);
  const requireRegistrationConsents =
    formData.get("require_registration_consents") === "1";

  // Cookie přežije Back z Google chooseru i když `?next=` z URL zmizí.
  await storePendingAuthReturnPath(safeNextPath);

  if (requireRegistrationConsents) {
    const consentError = validateRegistrationConsents(formData);
    if (consentError) {
      redirect(
        `/login?tab=register&next=${encodeURIComponent(safeNextPath)}&error=${encodeURIComponent(
          consentError.error ?? "Potvrďte povinné souhlasy.",
        )}`,
      );
    }
    await storePendingOAuthRegistrationConsents(
      readRegistrationConsentPayload(formData),
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(safeNextPath)}`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    redirect(
      `/login?next=${encodeURIComponent(safeNextPath)}&error=${encodeURIComponent(mapAuthError(error.message))}`,
    );
  }

  if (data.url) {
    redirect(data.url);
  }

  redirect(
    `/login?error=${encodeURIComponent(
      mapAuthError("oauth"),
    )}`,
  );
}

export async function signInWithEmail(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = readEmail(formData);
  const password = readPassword(formData);
  const nextPath = readNextPath(formData);

  if (!email || !password) {
    return { error: "Vyplňte e-mail i heslo." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: mapAuthError(error.message) };
  }

  await redirectAfterAuth(nextPath);
  return { error: "Přesměrování selhalo." };
}

export async function signUpWithEmail(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = readEmail(formData);
  const password = readPassword(formData);

  if (!email || !password) {
    return { error: "Vyplňte e-mail i heslo." };
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    return { error: `Heslo musí mít alespoň ${PASSWORD_MIN_LENGTH} znaků.` };
  }

  const consentError = validateRegistrationConsents(formData);
  if (consentError) {
    return consentError;
  }

  const consentPayload = readRegistrationConsentPayload(formData);
  const nextPath = readNextPath(formData);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Klientská stránka — zvládne ?code= i #access_token= (serverový callback hash nevidí).
      // `next` musí přežít e-mail verify (guest draft resume).
      emailRedirectTo: `${getSiteUrl()}/auth/dokoncit?next=${encodeURIComponent(nextPath)}`,
      data: {
        ...buildPendingConsentMetadata(consentPayload),
        [PENDING_REGISTRATION_METADATA_KEY]: true,
      },
    },
  });

  if (error) {
    return { error: mapAuthError(error.message) };
  }

  if (isDuplicateEmailSignup(data.user)) {
    return { error: DUPLICATE_EMAIL_MESSAGE };
  }

  if (!data.user) {
    return { error: "Registraci se nepodařilo dokončit. Zkuste to prosím znovu." };
  }

  if (data.session) {
    await persistRegistrationConsents(supabase, data.user.id, formData);
  }

  return {
    success:
      "Účet je vytvořený. Ověřte e-mail kliknutím na odkaz v doručené poště — bez toho se nepřihlásíte. Zkontrolujte i spam.",
    email,
  };
}

/** Znovu odešle ověřovací e-mail po registraci (U21). */
export async function resendSignupVerificationEmail(
  email: string,
  nextPath = "/",
): Promise<AuthFormState> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) {
    return { error: "Chybí e-mail pro opětovné odeslání." };
  }

  const safeNext = sanitizeInternalPath(nextPath);
  const supabase = await createClient();
  // Stejný cíl jako signUp — /auth/dokoncit čte PKCE code i implicit hash.
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: normalized,
    options: {
      emailRedirectTo: `${getSiteUrl()}/auth/dokoncit?next=${encodeURIComponent(safeNext)}`,
    },
  });

  if (error) {
    // Bez logu nešlo zpětně rozlišit cooldown/rate-limit od skutečného výpadku SMTP.
    console.error("resendSignupVerificationEmail failed:", {
      email: normalized,
      status: error.status,
      message: error.message,
    });
    return { error: mapAuthError(error.message) };
  }

  return {
    success:
      "Nový ověřovací e-mail je odeslaný. Otevřete ten nejnovější (starší odkaz už nefunguje) a zkontrolujte i spam.",
    email: normalized,
  };
}

export type ConfirmEmailResult = {
  error?: string;
  redirectTo?: string;
};

/** Vymění PKCE `code` za session — pro klientskou stránku `/auth/dokoncit`. */
export async function exchangeAuthCodeForSession(
  code: string,
  nextPath?: string,
): Promise<ConfirmEmailResult> {
  const trimmed = code.trim();
  if (!trimmed) {
    return { error: "Chybí autorizační kód." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(trimmed);

  if (error) {
    return { error: mapAuthError(error.message) };
  }

  const resolved = await resolvePostAuthNextPath(supabase, nextPath);
  revalidatePath("/", "layout");
  revalidatePath("/inzerat/novy");
  return { redirectTo: resolved };
}

/** Po klientském `setSession` (implicit hash) vrátí správný landing path. */
export async function resolveClientAuthLandingPath(
  nextPath?: string,
): Promise<string> {
  const supabase = await createClient();
  const resolved = await resolvePostAuthNextPath(supabase, nextPath);
  revalidatePath("/", "layout");
  revalidatePath("/inzerat/novy");
  return resolved;
}

/**
 * Potvrzení e-mailu až po kliknutí uživatele (POST) — odolá prefetch odkazů
 * e-mailovými klienty, které by jinak spotřebovaly GET verify token.
 */
export async function confirmEmailWithTokenHash(input: {
  tokenHash: string;
  otpType: string;
  nextPath?: string;
}): Promise<ConfirmEmailResult> {
  const tokenHash = input.tokenHash.trim();
  const otpType = parseEmailOtpType(input.otpType);
  if (!tokenHash || !otpType) {
    return { error: "Odkaz pro potvrzení e-mailu je neúplný nebo neplatný." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    type: otpType,
    token_hash: tokenHash,
  });

  if (error) {
    return {
      error:
        "Odkaz je neplatný nebo už byl použit. Požádejte o nový ověřovací e-mail (Poslat znovu).",
    };
  }

  const preferredNext =
    otpType === "recovery"
      ? "/auth/nastavit-heslo"
      : (input.nextPath ?? "/");

  const nextPath = await resolvePostAuthNextPath(supabase, preferredNext);

  revalidatePath("/", "layout");
  revalidatePath("/inzerat/novy");

  return { redirectTo: nextPath };
}

export async function requestPasswordReset(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = readEmail(formData);

  if (!email) {
    return { error: "Zadejte e-mail účtu." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getSiteUrl()}/auth/dokoncit?next=${encodeURIComponent("/auth/nastavit-heslo")}`,
  });

  if (error) {
    return { error: mapAuthError(error.message) };
  }

  return {
    success:
      "Pokud účet existuje, poslali jsme odkaz pro obnovení hesla. Zkontroluj e-mail.",
  };
}

export async function updatePassword(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const password = readPassword(formData);
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    return { error: `Nové heslo musí mít alespoň ${PASSWORD_MIN_LENGTH} znaků.` };
  }

  if (password !== confirm) {
    return { error: "Hesla se neshodují." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Platnost odkazu vypršela. Požádejte znovu o obnovení hesla." };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: mapAuthError(error.message) };
  }

  redirect("/login?message=password_updated");
  return { error: "Přesměrování selhalo." };
}

export async function completeOnboarding(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const rawNickname = String(formData.get("nickname") ?? "");
  const nextPath = readNextPath(formData);
  const isCompany = formData.get("isCompany") === "true";
  const companyName = String(formData.get("companyName") ?? "").trim();
  const companyIcoRaw = String(formData.get("companyIco") ?? "");
  const companyIco = normalizeIco(companyIcoRaw);

  if (isCompany) {
    if (companyName.length < 2 || companyName.length > 150) {
      return { error: "Název firmy musí mít 2–150 znaků." };
    }

    const icoError = companyIco ? validateIco(companyIco) : null;
    if (icoError) {
      return { error: icoError };
    }

    if (rawNickname.trim()) {
      const internalNicknameError = validateNickname(rawNickname);
      if (internalNicknameError) {
        return {
          error: `${internalNicknameError} Pro zobrazení u inzerátů použijte pole „Název firmy“ — interní jméno nechte prázdné, vygenerujeme ho automaticky.`,
        };
      }
    }
  } else {
    const validationError = validateNickname(rawNickname);
    if (validationError) {
      return { error: validationError };
    }
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (userRequiresRegistrationConsentsOnboarding(user)) {
    const alreadyRecorded = await profileHasRecordedConsents(supabase, user.id);
    if (!alreadyRecorded) {
      const consentError = validateRegistrationConsents(formData);
      if (consentError) {
        return consentError;
      }
      await persistRegistrationConsents(supabase, user.id, formData);
    }
  } else {
    await flushPendingRegistrationConsents(
      supabase,
      user.id,
      user.user_metadata ?? {},
    );
  }

  const internalNickname = isCompany
    ? resolveCompanyInternalNickname(rawNickname)
    : normalizeNickname(rawNickname);
  const nickname =
    isCompany && !internalNickname
      ? generateCompanyNickname(companyName, user.id)
      : (internalNickname ?? normalizeNickname(rawNickname));

  const { error } = await supabase
    .from("profiles")
    .update({
      nickname,
      is_company: isCompany,
      company_name: isCompany ? companyName : null,
      company_ico: isCompany && companyIco ? companyIco : null,
      company_ico_verified: false,
    })
    .eq("id", user.id);

  if (error) {
    if (isUniqueViolation(error)) {
      return { error: "Tato přezdívka je už obsazená. Zkuste jinou." };
    }

    return { error: "Nepodařilo se uložit přezdívku. Zkuste to prosím znovu." };
  }

  // Layout drží user (needsNicknameSetup); bez revalidate zůstane stale FAB/CTA
  // a Router Cache může mít prefetch redirectu /inzerat/novy → /onboarding.
  revalidatePath("/", "layout");
  revalidatePath("/inzerat/novy");
  revalidatePath("/onboarding");

  redirect(nextPath);
  return { error: "Přesměrování selhalo." };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
