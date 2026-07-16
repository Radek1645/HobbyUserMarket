-- =============================================================================
-- 049 — Absolutní životnost inzerátu (created_at + N dní, výchozí 365)
-- Konfigurace: listing_max_lifetime_days() — změ měnit CREATE OR REPLACE.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.listing_max_lifetime_days()
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
  SELECT 365;
$$;

COMMENT ON FUNCTION public.listing_max_lifetime_days() IS
  'Max. počet dní od posts.created_at, po kterých inzerát nesmí zůstat aktivní (včetně prodloužení).';

CREATE OR REPLACE FUNCTION public.listing_lifetime_hard_cap(p_created_at TIMESTAMPTZ)
RETURNS TIMESTAMPTZ
LANGUAGE sql
STABLE
AS $$
  SELECT p_created_at + (public.listing_max_lifetime_days() || ' days')::interval;
$$;

REVOKE ALL ON FUNCTION public.listing_max_lifetime_days() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.listing_max_lifetime_days() TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.listing_lifetime_hard_cap(TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.listing_lifetime_hard_cap(TIMESTAMPTZ) TO anon, authenticated, service_role;

-- Reason code pro automatické smazání po stropu životnosti
ALTER TABLE public.posts
  DROP CONSTRAINT IF EXISTS posts_status_reason_code_check;

ALTER TABLE public.posts
  ADD CONSTRAINT posts_status_reason_code_check
  CHECK (
    status_reason_code IS NULL
    OR status_reason_code IN ('reports_threshold', 'moderation', 'lifetime_max')
  );

-- expires_at z duration/event — clamp na hard cap od created_at
CREATE OR REPLACE FUNCTION public.handle_post_expiration_logic()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_created TIMESTAMPTZ;
  v_hard_cap TIMESTAMPTZ;
BEGIN
  v_created := COALESCE(NEW.created_at, now());
  v_hard_cap := public.listing_lifetime_hard_cap(v_created);

  IF NEW.category_type = 'udalost' THEN
    IF NEW.event_date IS NULL THEN
      RAISE EXCEPTION 'U kategorie udalost je pole event_date povinne.';
    END IF;
    NEW.expires_at := NEW.event_date + INTERVAL '1 day';
  ELSE
    NEW.event_date := NULL;
    IF NEW.listing_duration_days IS NULL THEN
      NEW.listing_duration_days := 30;
    END IF;
    NEW.expires_at := now() + (NEW.listing_duration_days || ' days')::interval;
  END IF;

  IF NEW.expires_at IS NOT NULL AND NEW.expires_at > v_hard_cap THEN
    NEW.expires_at := v_hard_cap;
  END IF;

  RETURN NEW;
END;
$$;

-- Privilegované sloupce + absolutní strop expires_at (nahrazuje rolling now()+366)
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
BEGIN
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

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.purge_listings_past_max_lifetime()
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH updated AS (
    UPDATE public.posts
    SET
      status = 'deleted',
      status_reason_code = 'lifetime_max',
      updated_at = now()
    WHERE status <> 'deleted'
      AND created_at + (public.listing_max_lifetime_days() || ' days')::interval <= now()
    RETURNING id
  )
  SELECT count(*)::INTEGER FROM updated;
$$;

REVOKE ALL ON FUNCTION public.purge_listings_past_max_lifetime() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purge_listings_past_max_lifetime() TO service_role;

-- Expiry warning kandidáti: doplnit created_at (pro copy „lze obnovit?“)
-- DROP nutný — CREATE OR REPLACE nemění OUT / RETURNS TABLE signaturu.
DROP FUNCTION IF EXISTS public.get_listing_expiry_warning_candidates(INTEGER, INTEGER);

CREATE FUNCTION public.get_listing_expiry_warning_candidates(
  p_days_before INTEGER DEFAULT 3,
  p_limit       INTEGER DEFAULT 200
)
RETURNS TABLE (
  post_id    BIGINT,
  user_id    UUID,
  title      TEXT,
  slug       TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
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
    p.created_at
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
