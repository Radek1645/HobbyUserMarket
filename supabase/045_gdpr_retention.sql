-- =============================================================================
-- 045 — GDPR retence neaktivních účtů (PRD §5.5)
-- Kandidáti: auth.users.last_sign_in_at <= now() - 90 dní, bez aktivních inzerátů.
-- Upozornění: 7 dní předem (83. den), idempotentně.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.gdpr_retention_warnings (
  user_id                 UUID NOT NULL,
  last_sign_in_at_snapshot TIMESTAMPTZ,
  warned_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, last_sign_in_at_snapshot)
);

ALTER TABLE public.gdpr_retention_warnings ENABLE ROW LEVEL SECURITY;

-- Service role potřebuje zapisovat (cron). Běžný uživatel nemá důvod tabulku číst.
GRANT SELECT, INSERT ON public.gdpr_retention_warnings TO service_role;

CREATE OR REPLACE FUNCTION public.get_gdpr_retention_warning_candidates(
  p_warning_after_days INTEGER DEFAULT 83,
  p_delete_after_days  INTEGER DEFAULT 90,
  p_limit              INTEGER DEFAULT 200
)
RETURNS TABLE (
  user_id UUID,
  last_sign_in_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT
    u.id AS user_id,
    u.last_sign_in_at
  FROM auth.users u
  WHERE
    u.last_sign_in_at IS NOT NULL
    AND u.last_sign_in_at <= now() - (p_warning_after_days || ' days')::interval
    AND u.last_sign_in_at >  now() - (p_delete_after_days  || ' days')::interval
    AND NOT EXISTS (
      SELECT 1
      FROM public.posts p
      WHERE p.user_id = u.id
        AND p.status = 'active'
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.gdpr_retention_warnings w
      WHERE w.user_id = u.id
        AND w.last_sign_in_at_snapshot IS NOT DISTINCT FROM u.last_sign_in_at
    )
  ORDER BY u.last_sign_in_at ASC
  LIMIT p_limit;
$$;

REVOKE ALL ON FUNCTION public.get_gdpr_retention_warning_candidates(INTEGER, INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_gdpr_retention_warning_candidates(INTEGER, INTEGER, INTEGER) TO service_role;

CREATE OR REPLACE FUNCTION public.mark_gdpr_retention_warning_sent(
  p_user_id UUID,
  p_last_sign_in_at TIMESTAMPTZ
)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.gdpr_retention_warnings (user_id, last_sign_in_at_snapshot)
  VALUES (p_user_id, p_last_sign_in_at)
  ON CONFLICT DO NOTHING;
$$;

REVOKE ALL ON FUNCTION public.mark_gdpr_retention_warning_sent(UUID, TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_gdpr_retention_warning_sent(UUID, TIMESTAMPTZ) TO service_role;

CREATE OR REPLACE FUNCTION public.get_gdpr_retention_deletion_candidates(
  p_delete_after_days INTEGER DEFAULT 90,
  p_limit             INTEGER DEFAULT 200
)
RETURNS TABLE (
  user_id UUID
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT
    u.id AS user_id
  FROM auth.users u
  WHERE
    u.last_sign_in_at IS NOT NULL
    AND u.last_sign_in_at <= now() - (p_delete_after_days || ' days')::interval
    AND NOT EXISTS (
      SELECT 1
      FROM public.posts p
      WHERE p.user_id = u.id
        AND p.status = 'active'
    )
  ORDER BY u.last_sign_in_at ASC
  LIMIT p_limit;
$$;

REVOKE ALL ON FUNCTION public.get_gdpr_retention_deletion_candidates(INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_gdpr_retention_deletion_candidates(INTEGER, INTEGER) TO service_role;

