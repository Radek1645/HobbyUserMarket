-- =============================================================================
-- 044 — Audit registračních souhlasů (věk 15+, VOP, marketing)
-- =============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS age_confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS vop_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS vop_version TEXT,
  ADD COLUMN IF NOT EXISTS marketing_consent_at TIMESTAMPTZ;

COMMENT ON COLUMN public.profiles.age_confirmed_at IS
  'Prohlášení uživatele, že je alespoň 15 let (GDPR, VOP §6).';
COMMENT ON COLUMN public.profiles.vop_accepted_at IS
  'Souhlas s VOP při registraci.';
COMMENT ON COLUMN public.profiles.vop_version IS
  'Verze VOP v okamžiku souhlasu.';
COMMENT ON COLUMN public.profiles.marketing_consent_at IS
  'Volitelný marketingový souhlas; NULL = neudělen.';

-- Rozšíření anonymizace účtu (037) — smazat audit souhlasů spolu s profilem
CREATE OR REPLACE FUNCTION public.prepare_user_account_deletion(
  p_user_id     UUID,
  p_actor_id    UUID,
  p_source      TEXT,
  p_reason_code TEXT DEFAULT NULL,
  p_reason_note TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_no BIGINT;
BEGIN
  IF p_source NOT IN ('self', 'admin') THEN
    RAISE EXCEPTION 'invalid source: %', p_source;
  END IF;

  SELECT profile_no INTO v_profile_no
  FROM public.profiles
  WHERE id = p_user_id;

  IF v_profile_no IS NULL THEN
    RAISE EXCEPTION 'profile not found: %', p_user_id;
  END IF;

  UPDATE public.comments
  SET author_nickname = '[smazaný účet]'
  WHERE user_id = p_user_id;

  UPDATE public.posts
  SET status = 'deleted', updated_at = now()
  WHERE user_id = p_user_id
    AND status <> 'deleted';

  UPDATE public.profiles
  SET
    nickname = 'deleted_' || v_profile_no::TEXT,
    email = 'deleted_' || v_profile_no::TEXT || '@deleted.local',
    name = NULL,
    surname = NULL,
    phone = NULL,
    avatar_url = NULL,
    is_company = false,
    company_name = NULL,
    company_ico = NULL,
    company_ico_verified = false,
    age_confirmed_at = NULL,
    vop_accepted_at = NULL,
    vop_version = NULL,
    marketing_consent_at = NULL,
    updated_at = now()
  WHERE id = p_user_id;

  INSERT INTO public.account_deletion_events (
    target_profile_no,
    target_user_id,
    actor_id,
    source,
    reason_code,
    reason_note
  ) VALUES (
    v_profile_no,
    p_user_id,
    p_actor_id,
    p_source,
    p_reason_code,
    p_reason_note
  );
END;
$$;
