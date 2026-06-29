"use server";

import { isPlaceholderNickname, normalizeNickname, validateNickname } from "@/lib/auth/nickname";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/supabase/env";
import { redirect } from "next/navigation";

export type AuthFormState = {
  error?: string;
  success?: string;
};

function readEmail(formData: FormData): string {
  return String(formData.get("email") ?? "").trim().toLowerCase();
}

function readPassword(formData: FormData): string {
  return String(formData.get("password") ?? "");
}

function readNextPath(formData: FormData): string {
  const next = String(formData.get("next") ?? "/");
  return next.startsWith("/") ? next : "/";
}

function mapAuthError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("invalid login credentials")) {
    return "Nesprávný e-mail nebo heslo.";
  }

  if (lower.includes("email not confirmed")) {
    return "E-mail ještě není ověřený. Zkontroluj schránku a klikni na odkaz v e-mailu.";
  }

  if (lower.includes("user already registered")) {
    return "Účet s tímto e-mailem už existuje. Přihlas se nebo obnov heslo.";
  }

  if (lower.includes("password")) {
    return "Heslo nesplňuje požadavky (minimálně 8 znaků).";
  }

  return message;
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
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(nextPath)}`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  if (data.url) {
    redirect(data.url);
  }

  redirect("/login?error=oauth");
}

export async function signInWithEmail(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = readEmail(formData);
  const password = readPassword(formData);
  const nextPath = readNextPath(formData);

  if (!email || !password) {
    return { error: "Vyplň e-mail i heslo." };
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
    return { error: "Vyplň e-mail i heslo." };
  }

  if (password.length < 8) {
    return { error: "Heslo musí mít alespoň 8 znaků." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${getSiteUrl()}/auth/callback?next=${encodeURIComponent("/onboarding")}`,
    },
  });

  if (error) {
    return { error: mapAuthError(error.message) };
  }

  return {
    success:
      "Účet je vytvořený. Ověř e-mail kliknutím na odkaz v doručené poště — bez toho se nepřihlásíš.",
  };
}

export async function requestPasswordReset(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = readEmail(formData);

  if (!email) {
    return { error: "Zadej e-mail účtu." };
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

  if (!password || password.length < 8) {
    return { error: "Nové heslo musí mít alespoň 8 znaků." };
  }

  if (password !== confirm) {
    return { error: "Hesla se neshodují." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Platnost odkazu vypršela. Požádej znovu o obnovení hesla." };
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
  const validationError = validateNickname(rawNickname);

  if (validationError) {
    return { error: validationError };
  }

  const nickname = normalizeNickname(rawNickname);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ nickname })
    .eq("id", user.id);

  if (error) {
    if (error.code === "23505") {
      return { error: "Tato přezdívka je už obsazená. Zkus jinou." };
    }

    return { error: "Nepodařilo se uložit přezdívku. Zkus to znovu." };
  }

  redirect(nextPath);
  return { error: "Přesměrování selhalo." };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
