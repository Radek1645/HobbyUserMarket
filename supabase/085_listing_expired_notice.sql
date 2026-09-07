-- =============================================================================
-- 085 — E-mail po stažení inzerátu (expirace → archived)
-- Idempotence: expiry_notice_for_expires_at = expires_at, pro které už mail odešel.
-- Backfill existujících archived/deleted, ať cron nespamuje historii.
-- Sloupec NENÍ v GRANT SELECT (anon/authenticated) — jen service_role cron.
-- =============================================================================

BEGIN;

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS expiry_notice_for_expires_at TIMESTAMPTZ;

COMMENT ON COLUMN public.posts.expiry_notice_for_expires_at IS
  'expires_at, pro které už bylo odesláno upozornění „inzerát stažen po expiraci“. Po prodloužení se expires_at změní → nový mail až po dalším stažení.';

-- Historie: nespamovat majitele inzerátů, které už dávno zmizely.
UPDATE public.posts
SET expiry_notice_for_expires_at = expires_at
WHERE status IN ('archived', 'deleted')
  AND expires_at IS NOT NULL
  AND expiry_notice_for_expires_at IS DISTINCT FROM expires_at;

CREATE OR REPLACE FUNCTION public.get_listing_expiry_notice_candidates(
  p_limit INTEGER DEFAULT 200
)
RETURNS TABLE (
  post_id       BIGINT,
  user_id       UUID,
  title         TEXT,
  slug          TEXT,
  expires_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ,
  category_type TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id AS post_id,
    p.user_id,
    p.title,
    p.slug,
    p.expires_at,
    p.created_at,
    p.category_type
  FROM public.posts p
  WHERE
    p.status = 'archived'
    AND p.user_id IS NOT NULL
    AND p.expires_at IS NOT NULL
    AND p.expires_at <= now()
    AND p.expiry_notice_for_expires_at IS DISTINCT FROM p.expires_at
  ORDER BY p.expires_at ASC
  LIMIT p_limit;
$$;

REVOKE ALL ON FUNCTION public.get_listing_expiry_notice_candidates(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_listing_expiry_notice_candidates(INTEGER) TO service_role;

CREATE OR REPLACE FUNCTION public.mark_listing_expiry_notice_sent(
  p_post_id    BIGINT,
  p_expires_at TIMESTAMPTZ
)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.posts
  SET expiry_notice_for_expires_at = p_expires_at
  WHERE id = p_post_id
    AND expires_at IS NOT DISTINCT FROM p_expires_at
    AND status = 'archived';
$$;

REVOKE ALL ON FUNCTION public.mark_listing_expiry_notice_sent(BIGINT, TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_listing_expiry_notice_sent(BIGINT, TIMESTAMPTZ) TO service_role;

-- Uživatel nesmí sloupec měnit (jen service_role přes RPC / cron).
CREATE OR REPLACE FUNCTION public.protect_post_privileged_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_privileged BOOLEAN :=
    COALESCE(auth.role(), '') NOT IN ('anon', 'authenticated')
    OR public.is_moderator_or_admin();
  v_duration_recalc BOOLEAN;
  v_hard_cap TIMESTAMPTZ;
  v_hidden_stamped BOOLEAN := false;
BEGIN
  IF TG_OP = 'UPDATE'
     AND OLD.hidden_at IS NULL
     AND NEW.status IN ('archived', 'deleted')
     AND OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.hidden_at := now();
    v_hidden_stamped := true;
  END IF;

  v_hard_cap := public.listing_lifetime_hard_cap(COALESCE(NEW.created_at, now()));

  IF NEW.expires_at IS NOT NULL AND NEW.expires_at > v_hard_cap THEN
    RAISE EXCEPTION 'expires_at exceeds listing max lifetime'
      USING errcode = '23514';
  END IF;

  IF v_privileged THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF COALESCE(NEW.payment_status, 'free') <> 'free' THEN
      RAISE EXCEPTION 'payment_status is not user-editable'
        USING errcode = '42501';
    END IF;
    IF COALESCE(NEW.renew_count, 0) <> 0 THEN
      RAISE EXCEPTION 'renew_count is not user-editable'
        USING errcode = '42501';
    END IF;
    IF NEW.expiry_warning_for_expires_at IS NOT NULL THEN
      RAISE EXCEPTION 'expiry_warning_for_expires_at is not user-editable'
        USING errcode = '42501';
    END IF;
    IF NEW.expiry_notice_for_expires_at IS NOT NULL THEN
      RAISE EXCEPTION 'expiry_notice_for_expires_at is not user-editable'
        USING errcode = '42501';
    END IF;
    IF NEW.hidden_at IS NOT NULL THEN
      RAISE EXCEPTION 'hidden_at is not user-editable'
        USING errcode = '42501';
    END IF;
    IF NEW.blocked_stale_warned_at IS NOT NULL THEN
      RAISE EXCEPTION 'blocked_stale_warned_at is not user-editable'
        USING errcode = '42501';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.hidden_at IS DISTINCT FROM OLD.hidden_at AND NOT v_hidden_stamped THEN
    RAISE EXCEPTION 'hidden_at is not user-editable'
      USING errcode = '42501';
  END IF;

  IF NEW.blocked_stale_warned_at IS DISTINCT FROM OLD.blocked_stale_warned_at THEN
    RAISE EXCEPTION 'blocked_stale_warned_at is not user-editable'
      USING errcode = '42501';
  END IF;

  IF NEW.expiry_warning_for_expires_at IS DISTINCT FROM OLD.expiry_warning_for_expires_at THEN
    RAISE EXCEPTION 'expiry_warning_for_expires_at is not user-editable'
      USING errcode = '42501';
  END IF;

  IF NEW.expiry_notice_for_expires_at IS DISTINCT FROM OLD.expiry_notice_for_expires_at THEN
    RAISE EXCEPTION 'expiry_notice_for_expires_at is not user-editable'
      USING errcode = '42501';
  END IF;

  IF NEW.payment_status IS DISTINCT FROM OLD.payment_status THEN
    RAISE EXCEPTION 'payment_status is not user-editable'
      USING errcode = '42501';
  END IF;

  IF NEW.renew_count IS DISTINCT FROM OLD.renew_count THEN
    IF NEW.renew_count <> OLD.renew_count + 1 THEN
      RAISE EXCEPTION 'renew_count can only be incremented by 1'
        USING errcode = '42501';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.expires_at IS DISTINCT FROM OLD.expires_at THEN
    v_duration_recalc :=
      NEW.listing_duration_days IS DISTINCT FROM OLD.listing_duration_days
      OR NEW.event_date IS DISTINCT FROM OLD.event_date
      OR NEW.event_end_date IS DISTINCT FROM OLD.event_end_date
      OR NEW.category_type IS DISTINCT FROM OLD.category_type;

    IF NOT v_duration_recalc THEN
      RAISE EXCEPTION 'expires_at is not directly user-editable'
        USING errcode = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Fail-closed: authenticated nesmí sloupec číst (není v GRANT SELECT).
DO $$
BEGIN
  PERFORM set_config('role', 'authenticated', true);

  BEGIN
    EXECUTE 'SELECT expiry_notice_for_expires_at FROM public.posts LIMIT 1';
    RAISE EXCEPTION '085: authenticated stále čte expiry_notice_for_expires_at';
  EXCEPTION
    WHEN insufficient_privilege THEN NULL;
  END;

  PERFORM set_config('role', 'none', true);
END;
$$;

COMMIT;
