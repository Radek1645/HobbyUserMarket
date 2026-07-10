-- 038 — limity publikovaných inzerátů a balíčky (předzvest monetizace)
-- PRD §6 architektonická příprava. Model: lifetime kredity (každá první publikace = 1 kredit).

-- -----------------------------------------------------------------------------
-- 0. Sloupec pro spotřebovaný lifetime kredit
-- -----------------------------------------------------------------------------
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS listing_quota_consumed BOOLEAN NOT NULL DEFAULT false;

UPDATE public.posts
SET listing_quota_consumed = true
WHERE listing_quota_consumed = false
  AND status <> 'draft';

-- -----------------------------------------------------------------------------
-- 1. Katalog balíčků
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.listing_packages (
  id              BIGSERIAL PRIMARY KEY,
  package_no      BIGINT GENERATED ALWAYS AS IDENTITY,
  slug            TEXT NOT NULL,
  display_name    TEXT NOT NULL,
  plan_label      TEXT,
  listing_quota   INTEGER NOT NULL,
  price_cents     INTEGER,
  description     TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  is_purchasable  BOOLEAN NOT NULL DEFAULT false,
  is_signup_grant BOOLEAN NOT NULL DEFAULT false,
  sort_order      SMALLINT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT listing_packages_slug_unique UNIQUE (slug),
  CONSTRAINT listing_packages_listing_quota_positive CHECK (listing_quota > 0),
  CONSTRAINT listing_packages_price_cents_non_negative
    CHECK (price_cents IS NULL OR price_cents >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS listing_packages_package_no_idx
  ON public.listing_packages (package_no);

CREATE UNIQUE INDEX IF NOT EXISTS listing_packages_signup_grant_idx
  ON public.listing_packages (is_signup_grant)
  WHERE is_signup_grant = true;

DROP TRIGGER IF EXISTS trg_listing_packages_updated_at ON public.listing_packages;
CREATE TRIGGER trg_listing_packages_updated_at
  BEFORE UPDATE ON public.listing_packages
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 2. Přidělené balíčky uživatelům (sčítají se)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_listing_entitlements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entitlement_no  BIGINT GENERATED ALWAYS AS IDENTITY,
  user_id         UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  package_id      BIGINT NOT NULL REFERENCES public.listing_packages (id) ON DELETE RESTRICT,
  listing_quota   INTEGER NOT NULL,
  granted_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  granted_by      UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  note            TEXT,
  expires_at      TIMESTAMPTZ,

  CONSTRAINT user_listing_entitlements_quota_positive CHECK (listing_quota > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS user_listing_entitlements_entitlement_no_idx
  ON public.user_listing_entitlements (entitlement_no);

CREATE INDEX IF NOT EXISTS user_listing_entitlements_user_id_idx
  ON public.user_listing_entitlements (user_id);

-- -----------------------------------------------------------------------------
-- 3. Seed balíčků
-- -----------------------------------------------------------------------------
INSERT INTO public.listing_packages (
  slug,
  display_name,
  plan_label,
  listing_quota,
  price_cents,
  description,
  is_purchasable,
  is_signup_grant,
  sort_order
)
VALUES
  (
    'free',
    'Start zdarma',
    'Free',
    20,
    NULL,
    'Výchozí balíček pro každý nový účet.',
    false,
    true,
    0
  ),
  (
    'standard_20',
    'Balíček +20 inzerátů',
    NULL,
    20,
    5000,
    'Dalších 20 publikací inzerátů (lifetime kredit).',
    false,
    false,
    10
  ),
  (
    'promo_partner',
    'Partnerský balíček',
    NULL,
    20,
    NULL,
    'Manuálně přidělený balíček pro vybrané uživatele.',
    false,
    false,
    20
  )
ON CONFLICT (slug) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 4. Helper funkce
-- -----------------------------------------------------------------------------
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

-- zpětná kompatibilita (starší volání)
CREATE OR REPLACE FUNCTION public.user_listing_slot_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.user_listing_lifetime_count(p_user_id);
$$;

CREATE OR REPLACE FUNCTION public.user_listing_quota_limit(p_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(sum(e.listing_quota), 0)::INTEGER
  FROM public.user_listing_entitlements e
  WHERE e.user_id = p_user_id
    AND (e.expires_at IS NULL OR e.expires_at > now());
$$;

CREATE OR REPLACE FUNCTION public.user_has_listing_quota_bypass(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles pr
    WHERE pr.id = p_user_id
      AND pr.role IN ('admin', 'moderator')
  );
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
  v_consumed      BOOLEAN;
  v_used        INTEGER;
  v_limit       INTEGER;
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

  IF v_limit <= 0 THEN
    RAISE EXCEPTION 'listing_quota_exceeded' USING errcode = 'P0001';
  END IF;

  IF v_used >= v_limit THEN
    RAISE EXCEPTION 'listing_quota_exceeded' USING errcode = 'P0001';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.grant_listing_package(
  p_user_id UUID,
  p_package_slug TEXT,
  p_granted_by UUID DEFAULT NULL,
  p_note TEXT DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_package public.listing_packages%ROWTYPE;
  v_entitlement_id BIGINT;
BEGIN
  SELECT *
  INTO v_package
  FROM public.listing_packages lp
  WHERE lp.slug = p_package_slug
    AND lp.is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'listing_package_not_found' USING errcode = 'P0002';
  END IF;

  INSERT INTO public.user_listing_entitlements (
    user_id,
    package_id,
    listing_quota,
    granted_by,
    note
  )
  VALUES (
    p_user_id,
    v_package.id,
    v_package.listing_quota,
    p_granted_by,
    p_note
  )
  RETURNING entitlement_no INTO v_entitlement_id;

  RETURN v_entitlement_id;
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

CREATE OR REPLACE FUNCTION public.admin_grant_listing_package(
  p_user_id UUID,
  p_package_slug TEXT,
  p_note TEXT DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'admin_required' USING errcode = '42501';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'user_not_found' USING errcode = 'P0002';
  END IF;

  RETURN public.grant_listing_package(
    p_user_id,
    p_package_slug,
    auth.uid(),
    p_note
  );
END;
$$;

-- -----------------------------------------------------------------------------
-- 5. Trigger — vynucení limitu při první publikaci (spotřeba lifetime kreditu)
-- -----------------------------------------------------------------------------
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

DROP TRIGGER IF EXISTS trg_posts_enforce_listing_quota ON public.posts;
CREATE TRIGGER trg_posts_enforce_listing_quota
  BEFORE INSERT OR UPDATE OF status ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_listing_quota_on_publish();

-- -----------------------------------------------------------------------------
-- 6. Registrace — automatický free balíček
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nickname, email, name, avatar_url, role)
  VALUES (
    NEW.id,
    'user_' || substr(replace(NEW.id::text, '-', ''), 1, 12),
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data ->> 'full_name',
      NEW.raw_user_meta_data ->> 'name'
    ),
    COALESCE(
      NEW.raw_user_meta_data ->> 'avatar_url',
      NEW.raw_user_meta_data ->> 'picture'
    ),
    'user'
  );

  PERFORM public.grant_listing_package(NEW.id, 'free', NULL, 'signup');

  RETURN NEW;
END;
$$;

-- Backfill pro existující uživatele bez entitlementu
INSERT INTO public.user_listing_entitlements (user_id, package_id, listing_quota, note)
SELECT
  p.id,
  lp.id,
  lp.listing_quota,
  'backfill_signup'
FROM public.profiles p
CROSS JOIN public.listing_packages lp
WHERE lp.slug = 'free'
  AND NOT EXISTS (
    SELECT 1
    FROM public.user_listing_entitlements e
    WHERE e.user_id = p.id
  );

-- -----------------------------------------------------------------------------
-- 7. RLS
-- -----------------------------------------------------------------------------
ALTER TABLE public.listing_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_listing_entitlements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS listing_packages_select_active ON public.listing_packages;
CREATE POLICY listing_packages_select_active ON public.listing_packages
  FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

DROP POLICY IF EXISTS user_listing_entitlements_select_own ON public.user_listing_entitlements;
CREATE POLICY user_listing_entitlements_select_own ON public.user_listing_entitlements
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

-- -----------------------------------------------------------------------------
-- 8. Grants
-- -----------------------------------------------------------------------------
GRANT SELECT ON public.listing_packages TO anon, authenticated;
GRANT SELECT ON public.user_listing_entitlements TO authenticated;

REVOKE ALL ON FUNCTION public.grant_listing_package(UUID, TEXT, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.grant_listing_package(UUID, TEXT, UUID, TEXT) TO service_role;

REVOKE ALL ON FUNCTION public.get_user_listing_quota(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_listing_quota(UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.admin_grant_listing_package(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_grant_listing_package(UUID, TEXT, TEXT) TO authenticated;
