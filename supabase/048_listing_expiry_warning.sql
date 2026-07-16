-- =============================================================================
-- 048 — E-mail upozornění před expirací inzerátu
-- Kandidáti: active, expires_at v okně N dní, ještě neupozorněni pro dané expires_at.
-- =============================================================================

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS expiry_warning_for_expires_at TIMESTAMPTZ;

COMMENT ON COLUMN public.posts.expiry_warning_for_expires_at IS
  'expires_at, pro které už bylo odesláno upozornění „brzy expiruje“. Po prodloužení se expires_at změní → nová výstraha.';

CREATE OR REPLACE FUNCTION public.get_listing_expiry_warning_candidates(
  p_days_before INTEGER DEFAULT 3,
  p_limit       INTEGER DEFAULT 200
)
RETURNS TABLE (
  post_id    BIGINT,
  user_id    UUID,
  title      TEXT,
  slug       TEXT,
  expires_at TIMESTAMPTZ
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
    p.expires_at
  FROM public.posts p
  WHERE
    p.status = 'active'
    AND p.user_id IS NOT NULL
    AND p.expires_at IS NOT NULL
    AND p.expires_at > now()
    AND p.expires_at <= now() + (p_days_before || ' days')::interval
    AND p.expiry_warning_for_expires_at IS DISTINCT FROM p.expires_at
  ORDER BY p.expires_at ASC
  LIMIT p_limit;
$$;

REVOKE ALL ON FUNCTION public.get_listing_expiry_warning_candidates(INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_listing_expiry_warning_candidates(INTEGER, INTEGER) TO service_role;

CREATE OR REPLACE FUNCTION public.mark_listing_expiry_warning_sent(
  p_post_id    BIGINT,
  p_expires_at TIMESTAMPTZ
)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.posts
  SET expiry_warning_for_expires_at = p_expires_at
  WHERE id = p_post_id
    AND expires_at IS NOT DISTINCT FROM p_expires_at;
$$;

REVOKE ALL ON FUNCTION public.mark_listing_expiry_warning_sent(BIGINT, TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_listing_expiry_warning_sent(BIGINT, TIMESTAMPTZ) TO service_role;

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
BEGIN
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
    RETURN NEW;
  END IF;

  IF NEW.expiry_warning_for_expires_at IS DISTINCT FROM OLD.expiry_warning_for_expires_at THEN
    RAISE EXCEPTION 'expiry_warning_for_expires_at is not user-editable'
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
      OR NEW.category_type IS DISTINCT FROM OLD.category_type;

    IF NOT v_duration_recalc THEN
      RAISE EXCEPTION 'expires_at is not directly user-editable'
        USING errcode = '42501';
    END IF;
  END IF;

  -- Absolutní strop expires_at: migrace 049 (listing_max_lifetime_days).

  RETURN NEW;
END;
$$;
