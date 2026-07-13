import { CURRENT_VOP_VERSION } from "@/config/legal";
import type { SupabaseClient } from "@supabase/supabase-js";

const PENDING_CONSENTS_METADATA_KEY = "pending_registration_consents";

export type RegistrationConsentPayload = {
  marketing: boolean;
  vopVersion: string;
};

export type RegistrationConsentRowUpdate = {
  age_confirmed_at: string;
  vop_accepted_at: string;
  vop_version: string;
  marketing_consent_at: string | null;
};

function buildConsentRowUpdate(
  marketing: boolean,
  vopVersion: string,
): RegistrationConsentRowUpdate {
  const now = new Date().toISOString();
  return {
    age_confirmed_at: now,
    vop_accepted_at: now,
    vop_version: vopVersion,
    marketing_consent_at: marketing ? now : null,
  };
}

export function readRegistrationConsentPayload(
  formData: FormData,
): RegistrationConsentPayload {
  return {
    marketing: formData.get("consent_marketing") === "1",
    vopVersion: CURRENT_VOP_VERSION,
  };
}

export function readPendingConsentPayload(
  metadata: Record<string, unknown>,
): RegistrationConsentPayload | null {
  const raw = metadata[PENDING_CONSENTS_METADATA_KEY];
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const record = raw as Record<string, unknown>;
  return {
    marketing: record.marketing === true,
    vopVersion:
      typeof record.vop_version === "string"
        ? record.vop_version
        : CURRENT_VOP_VERSION,
  };
}

export function buildPendingConsentMetadata(
  payload: RegistrationConsentPayload,
): Record<string, unknown> {
  return {
    [PENDING_CONSENTS_METADATA_KEY]: {
      marketing: payload.marketing,
      vop_version: payload.vopVersion,
    },
  };
}

async function profileHasRecordedConsents(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("profiles")
    .select("age_confirmed_at")
    .eq("id", userId)
    .maybeSingle<{ age_confirmed_at: string | null }>();

  return Boolean(data?.age_confirmed_at);
}

/** Uloží souhlasy z registračního formuláře — jen pokud ještě nejsou v DB. */
export async function persistRegistrationConsents(
  supabase: SupabaseClient,
  userId: string,
  formData: FormData,
): Promise<void> {
  if (await profileHasRecordedConsents(supabase, userId)) {
    return;
  }

  const payload = readRegistrationConsentPayload(formData);
  const update = buildConsentRowUpdate(payload.marketing, payload.vopVersion);

  await supabase.from("profiles").update(update).eq("id", userId);
}

/** E-mail registrace bez aktivní session — dočasně v auth metadata. */
export async function storePendingRegistrationConsents(
  supabase: SupabaseClient,
  formData: FormData,
): Promise<void> {
  const payload = readRegistrationConsentPayload(formData);
  await supabase.auth.updateUser({
    data: buildPendingConsentMetadata(payload),
  });
}

/** Po prvním přihlášení přesune pending souhlasy z metadata do profiles. */
export async function flushPendingRegistrationConsents(
  supabase: SupabaseClient,
  userId: string,
  metadata: Record<string, unknown>,
): Promise<void> {
  const payload = readPendingConsentPayload(metadata);
  if (!payload) {
    return;
  }

  if (await profileHasRecordedConsents(supabase, userId)) {
    await supabase.auth.updateUser({
      data: { [PENDING_CONSENTS_METADATA_KEY]: null },
    });
    return;
  }

  const update = buildConsentRowUpdate(payload.marketing, payload.vopVersion);
  await supabase.from("profiles").update(update).eq("id", userId);
  await supabase.auth.updateUser({
    data: { [PENDING_CONSENTS_METADATA_KEY]: null },
  });
}
