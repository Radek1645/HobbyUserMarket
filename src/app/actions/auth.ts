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
import { getSiteUrl } from "@/lib/supabase/env";
import {
  userRequiresRegistrationConsentsOnboarding,
  validateRegistrationConsents,
} from "@/lib/auth/registration-consents";
import {
  flushPendingRegistrationConsents,
  persistRegistrationConsents,
  readRegistrationConsentPayload,
  buildPendingConsentMetadata,
} from "@/lib/auth/persist-registration-consents";
import { sanitizeInternalPath } from "@/lib/auth/sanitize-internal-path";
import {
  DUPLICATE_EMAIL_MESSAGE,
  mapAuthError,
} from "@/lib/auth/map-auth-error";
import { PASSWORD_MIN_LENGTH } from "@/config/app";
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

  if (!profile || isPlaceholderNickname(profile.nickname)) {
    redirect(`/onboarding?next=${encodeURIComponent(nextPath)}`);
  }

  redirect(nextPath);
}

export async function signInWithGoogle(nextPath = "/") {
  const safeNextPath = sanitizeInternalPath(nextPath);
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
      `/login?error=${encodeURIComponent(mapAuthError(error.message))}`,
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

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${getSiteUrl()}/auth/callback?next=${encodeURIComponent("/onboarding")}`,
      data: buildPendingConsentMetadata(consentPayload),
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
      "Účet je vytvořený. Ověřte e-mail kliknutím na odkaz v doručené poště — bez toho se nepřihlásíte.",
    email,
  };
}

/** Znovu odešle ověřovací e-mail po registraci (U21). */
export async function resendSignupVerificationEmail(
  email: string,
): Promise<AuthFormState> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) {
    return { error: "Chybí e-mail pro opětovné odeslání." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: normalized,
    options: {
      emailRedirectTo: `${getSiteUrl()}/auth/callback?next=${encodeURIComponent("/onboarding")}`,
    },
  });

  if (error) {
    return { error: mapAuthError(error.message) };
  }

  return {
    success: "Ověřovací e-mail jsme znovu odeslali. Zkontrolujte schránku.",
    email: normalized,
  };
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
    redirectTo: `${getSiteUrl()}/auth/callback?next=${encodeURIComponent("/auth/nastavit-heslo")}`,
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
    const consentError = validateRegistrationConsents(formData);
    if (consentError) {
      return consentError;
    }
    await persistRegistrationConsents(supabase, user.id, formData);
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

  redirect(nextPath);
  return { error: "Přesměrování selhalo." };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
