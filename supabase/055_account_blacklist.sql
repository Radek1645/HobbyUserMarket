-- =============================================================================
-- 055 — Hard stop: blacklist podle e-mailu (auto 3×/24h nebo ručně)
-- Soft unban (removed_at). Skrytí inzerátů = posts.blocked + account_blacklist.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.account_blacklist (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blacklist_no    BIGINT GENERATED ALWAYS AS IDENTITY,
  email           TEXT NOT NULL,
  reason          TEXT NOT NULL,
  source          TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by      UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  removed_at      TIMESTAMPTZ,
  removed_by      UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  removed_reason  TEXT,

  CONSTRAINT account_blacklist_source_check
    CHECK (source IN ('automatic', 'manual')),
  CONSTRAINT account_blacklist_email_nonempty_check
    CHECK (char_length(trim(email)) > 0),
  CONSTRAINT account_blacklist_removed_reason_check
    CHECK (
      (removed_at IS NULL AND removed_reason IS NULL AND removed_by IS NULL)
      OR (removed_at IS NOT NULL AND removed_reason IS NOT NULL)
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS account_blacklist_no_idx
  ON public.account_blacklist (blacklist_no);

-- Jeden aktivní záznam na e-mail (normalizovaný).
CREATE UNIQUE INDEX IF NOT EXISTS account_blacklist_active_email_idx
  ON public.account_blacklist (lower(trim(email)))
  WHERE removed_at IS NULL;

CREATE INDEX IF NOT EXISTS account_blacklist_created_idx
  ON public.account_blacklist (created_at DESC);

CREATE INDEX IF NOT EXISTS account_blacklist_removed_idx
  ON public.account_blacklist (removed_at)
  WHERE removed_at IS NOT NULL;

ALTER TABLE public.account_blacklist ENABLE ROW LEVEL SECURITY;

-- Moderátor / admin: plný přehled.
DROP POLICY IF EXISTS account_blacklist_select_staff
  ON public.account_blacklist;
CREATE POLICY account_blacklist_select_staff
  ON public.account_blacklist
  FOR SELECT TO authenticated
  USING (public.is_moderator_or_admin());

-- Přihlášený uživatel: jen řádek se svým JWT e-mailem (middleware gate).
DROP POLICY IF EXISTS account_blacklist_select_own
  ON public.account_blacklist;
CREATE POLICY account_blacklist_select_own
  ON public.account_blacklist
  FOR SELECT TO authenticated
  USING (
    lower(trim(email)) = lower(trim(COALESCE(auth.jwt() ->> 'email', '')))
  );

DROP POLICY IF EXISTS account_blacklist_insert_staff
  ON public.account_blacklist;
CREATE POLICY account_blacklist_insert_staff
  ON public.account_blacklist
  FOR INSERT TO authenticated
  WITH CHECK (public.is_moderator_or_admin());

DROP POLICY IF EXISTS account_blacklist_update_staff
  ON public.account_blacklist;
CREATE POLICY account_blacklist_update_staff
  ON public.account_blacklist
  FOR UPDATE TO authenticated
  USING (public.is_moderator_or_admin())
  WITH CHECK (public.is_moderator_or_admin());

GRANT SELECT, INSERT, UPDATE ON public.account_blacklist TO authenticated;
GRANT ALL ON public.account_blacklist TO service_role;

-- Důvod skrytí inzerátů při hard stopu.
ALTER TABLE public.posts
  DROP CONSTRAINT IF EXISTS posts_status_reason_code_check;

ALTER TABLE public.posts
  ADD CONSTRAINT posts_status_reason_code_check
  CHECK (
    status_reason_code IS NULL
    OR status_reason_code IN (
      'reports_threshold',
      'moderation',
      'lifetime_max',
      'account_blacklist'
    )
  );

-- Rychlý lookup pro Edge / middleware (SECURITY DEFINER).
CREATE OR REPLACE FUNCTION public.is_email_blacklisted(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.account_blacklist b
    WHERE b.removed_at IS NULL
      AND lower(trim(b.email)) = lower(trim(p_email))
      AND char_length(trim(COALESCE(p_email, ''))) > 0
  );
$$;

REVOKE ALL ON FUNCTION public.is_email_blacklisted(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_email_blacklisted(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_email_blacklisted(TEXT) TO service_role;
