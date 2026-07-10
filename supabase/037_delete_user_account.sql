-- =============================================================================
-- 037 — Smazání uživatelského účtu (P23, PRD §5.5)
-- posts.user_id → ON DELETE SET NULL; RPC prepare_user_account_deletion;
-- audit tabulka account_deletion_events.
-- Auth smazání probíhá v aplikaci přes auth.admin.deleteUser().
-- =============================================================================

-- Umožní ponechat soft-deleted inzeráty po smazání auth.users
ALTER TABLE public.posts
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.posts
  DROP CONSTRAINT IF EXISTS posts_user_id_fkey;

ALTER TABLE public.posts
  ADD CONSTRAINT posts_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.account_deletion_events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_no          BIGINT GENERATED ALWAYS AS IDENTITY,
  target_profile_no BIGINT,
  target_user_id    UUID,
  actor_id          UUID,
  source            TEXT NOT NULL CHECK (source IN ('self', 'admin')),
  reason_code       TEXT,
  reason_note       TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS account_deletion_events_event_no_idx
  ON public.account_deletion_events (event_no);

ALTER TABLE public.account_deletion_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS account_deletion_events_select_admin ON public.account_deletion_events;
CREATE POLICY account_deletion_events_select_admin ON public.account_deletion_events
  FOR SELECT TO authenticated
  USING (public.is_admin());

GRANT SELECT, INSERT ON public.account_deletion_events TO service_role;

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

REVOKE ALL ON FUNCTION public.prepare_user_account_deletion(UUID, UUID, TEXT, TEXT, TEXT)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.prepare_user_account_deletion(UUID, UUID, TEXT, TEXT, TEXT)
  TO service_role;
