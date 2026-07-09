-- =============================================================================
-- 035 — Cron archivace expirovaných inzerátů (PRD §9.5, audit P4)
-- active → archived kde expires_at <= now(). Volá service_role / cron API.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.archive_expired_posts()
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH updated AS (
    UPDATE public.posts
    SET status = 'archived', updated_at = now()
    WHERE status = 'active'
      AND expires_at IS NOT NULL
      AND expires_at <= now()
    RETURNING id
  )
  SELECT count(*)::INTEGER FROM updated;
$$;

REVOKE ALL ON FUNCTION public.archive_expired_posts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.archive_expired_posts() TO service_role;
