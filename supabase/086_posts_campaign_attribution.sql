-- =============================================================================
-- 086 — UTM / click-id při založení inzerátu
-- First-touch v posts.campaign_attribution (JSONB). Není v GRANT SELECT
-- anon/authenticated — fail-closed; čte service_role (God Mode přes admin).
-- Uživatel sloupec nesmí zapsat ani přepsat (protect_post_privileged_columns).
-- =============================================================================

BEGIN;

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS campaign_attribution JSONB;

COMMENT ON COLUMN public.posts.campaign_attribution IS
  'First-touch UTM / fbclid / gclid z prohlížeče při založení inzerátu. Null = organický vstup nebo nic v localStorage. Neměnit při editaci.';

CREATE INDEX IF NOT EXISTS posts_campaign_attribution_utm_source_idx
  ON public.posts ((campaign_attribution->>'utm_source'))
  WHERE campaign_attribution IS NOT NULL;

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
    IF NEW.campaign_attribution IS NOT NULL THEN
      RAISE EXCEPTION 'campaign_attribution is not user-editable'
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

  IF NEW.campaign_attribution IS DISTINCT FROM OLD.campaign_attribution THEN
    RAISE EXCEPTION 'campaign_attribution is not user-editable'
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

-- Fail-closed: anon i authenticated nesmí sloupec číst (není v GRANT SELECT).
DO $$
BEGIN
  PERFORM set_config('role', 'anon', true);

  BEGIN
    EXECUTE 'SELECT campaign_attribution FROM public.posts LIMIT 1';
    RAISE EXCEPTION '086: anon stále čte campaign_attribution';
  EXCEPTION
    WHEN insufficient_privilege THEN NULL;
  END;

  PERFORM set_config('role', 'authenticated', true);

  BEGIN
    EXECUTE 'SELECT campaign_attribution FROM public.posts LIMIT 1';
    RAISE EXCEPTION '086: authenticated stále čte campaign_attribution';
  EXCEPTION
    WHEN insufficient_privilege THEN NULL;
  END;

  PERFORM set_config('role', 'none', true);
END;
$$;

COMMIT;
