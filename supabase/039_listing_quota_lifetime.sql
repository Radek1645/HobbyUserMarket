-- 039 — přepnutí limitu inzerátů na lifetime kredity (pokud už běží stará verze 038)
-- Bezpečné spustit i na DB, kde je 038 už s lifetime modelem.

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS listing_quota_consumed BOOLEAN NOT NULL DEFAULT false;

UPDATE public.posts
SET listing_quota_consumed = true
WHERE listing_quota_consumed = false
  AND status <> 'draft';

UPDATE public.listing_packages
SET description = 'Dalších 20 publikací inzerátů (lifetime kredit).'
WHERE slug = 'standard_20';

CREATE OR REPLACE FUNCTION public.user_listing_lifetime_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::INTEGER
  FROM public.posts p
  WHERE p.user_id = p_user_id
    AND p.listing_quota_consumed = true;
$$;

CREATE OR REPLACE FUNCTION public.user_listing_slot_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.user_listing_lifetime_count(p_user_id);
$$;

CREATE OR REPLACE FUNCTION public.assert_user_listing_quota(
  p_user_id UUID,
  p_post_id BIGINT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_consumed BOOLEAN;
  v_used     INTEGER;
  v_limit    INTEGER;
BEGIN
  IF public.user_has_listing_quota_bypass(p_user_id) THEN
    RETURN;
  END IF;

  SELECT p.listing_quota_consumed
  INTO v_consumed
  FROM public.posts p
  WHERE p.id = p_post_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'post_not_found' USING errcode = 'P0002';
  END IF;

  IF v_consumed THEN
    RETURN;
  END IF;

  v_used := public.user_listing_lifetime_count(p_user_id);
  v_limit := public.user_listing_quota_limit(p_user_id);

  IF v_limit <= 0 OR v_used >= v_limit THEN
    RAISE EXCEPTION 'listing_quota_exceeded' USING errcode = 'P0001';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_listing_quota(p_user_id UUID DEFAULT auth.uid())
RETURNS TABLE (
  plan_label TEXT,
  used_count INTEGER,
  total_limit INTEGER,
  remaining INTEGER
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := COALESCE(p_user_id, auth.uid());
  v_used INTEGER;
  v_limit INTEGER;
  v_plan TEXT;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING errcode = '28000';
  END IF;

  IF auth.uid() IS NOT NULL
     AND v_uid IS DISTINCT FROM auth.uid()
     AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden' USING errcode = '42501';
  END IF;

  v_used := public.user_listing_lifetime_count(v_uid);
  v_limit := public.user_listing_quota_limit(v_uid);

  SELECT COALESCE(
    (
      SELECT lp.plan_label
      FROM public.user_listing_entitlements e
      JOIN public.listing_packages lp ON lp.id = e.package_id
      WHERE e.user_id = v_uid
        AND lp.plan_label IS NOT NULL
        AND (e.expires_at IS NULL OR e.expires_at > now())
      ORDER BY e.granted_at ASC
      LIMIT 1
    ),
    'Free'
  )
  INTO v_plan;

  RETURN QUERY
  SELECT
    v_plan,
    v_used,
    v_limit,
    GREATEST(v_limit - v_used, 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_listing_quota_on_publish()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IN ('active', 'hidden')
     AND NOT NEW.listing_quota_consumed THEN
    PERFORM public.assert_user_listing_quota(NEW.user_id, NEW.id);
    NEW.listing_quota_consumed := true;
  END IF;

  RETURN NEW;
END;
$$;
