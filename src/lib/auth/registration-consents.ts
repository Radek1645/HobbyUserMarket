import { LEGAL_UI } from "@/config/legal";
import type { User } from "@supabase/supabase-js";

export type RegistrationConsentFormState = {
  error?: string;
};

/** Nový účet přes Google (bez e-mailové identity) — souhlasy na onboardingu. */
export function userRequiresRegistrationConsentsOnboarding(
  user: User | null | undefined,
): boolean {
  const identities = user?.identities ?? [];
  return !identities.some((identity) => identity.provider === "email");
}

export function validateRegistrationConsents(
  formData: FormData,
): RegistrationConsentFormState | null {
  if (formData.get("consent_vop") !== "1") {
    return {
      error:
        "Pro založení účtu je nutný souhlas s všeobecnými obchodními podmínkami.",
    };
  }

  if (formData.get("consent_age") !== "1") {
    return { error: LEGAL_UI.registrationAgeConsentError };
  }

  return null;
}
