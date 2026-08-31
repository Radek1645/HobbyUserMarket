-- =============================================================================
-- 082 — Soukromé události + vícedenní akce (event_end_date)
--
-- is_post_publicly_visible(status, expires_at) NECHÁVÁME 2-arg: je to USING
-- u posts_select_public. Kdyby tam přibylo AND NOT is_private, detail podle
-- slugu by spadl (REST SELECT). Soukromí = filtr ve výpisech, ne RLS.
--
-- Nové sloupce do GRANT SELECT (anon + authenticated) — jinak 42501.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Schema
-- -----------------------------------------------------------------------------
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS event_end_date TIMESTAMPTZ NULL;

COMMENT ON COLUMN public.posts.is_private IS
  'Soukromá událost: není ve výpisech, detail podle slugu ano. Jen category_type = udalost.';

COMMENT ON COLUMN public.posts.event_end_date IS
  'Konec vícedenní akce (UX). expires_at = půlnoc po tomto dni; NULL = jednodenní.';

ALTER TABLE public.posts
  DROP CONSTRAINT IF EXISTS posts_is_private_event_only;
ALTER TABLE public.posts
  ADD CONSTRAINT posts_is_private_event_only
  CHECK (is_private = false OR category_type = 'udalost');

ALTER TABLE public.posts
  DROP CONSTRAINT IF EXISTS posts_event_end_date_order;
ALTER TABLE public.posts
  ADD CONSTRAINT posts_event_end_date_order
  CHECK (
    event_end_date IS NULL
    OR (category_type = 'udalost' AND event_end_date >= event_date)
  );

GRANT SELECT (is_private, event_end_date) ON public.posts TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- 2. Expirace: půlnoc po dni konce (nebo začátku)
-- -----------------------------------------------------------------------------
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
    NEW.expires_at := public.event_listing_expires_at(
      COALESCE(NEW.event_end_date, NEW.event_date)
    );
  ELSE
    NEW.event_date := NULL;
    NEW.event_end_date := NULL;
    NEW.is_private := false;
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

DROP TRIGGER IF EXISTS trigger_post_expiration_logic ON public.posts;
CREATE TRIGGER trigger_post_expiration_logic
  BEFORE INSERT OR UPDATE OF category_type, event_date, event_end_date, listing_duration_days
  ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_post_expiration_logic();

-- PATCH jen konce musí smět přepsat expires_at (jinak 42501 z 081).
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

-- -----------------------------------------------------------------------------
-- 3. Výpisy: AND NOT is_private + event_end_date ve výstupu
--    RETURNS TABLE se mění → DROP + CREATE (CREATE OR REPLACE nestačí).
-- -----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_nearby_posts(
  DOUBLE PRECISION,
  DOUBLE PRECISION,
  DOUBLE PRECISION[],
  INTEGER,
  INTEGER,
  TEXT
);

CREATE FUNCTION public.get_nearby_posts(
  p_latitude DOUBLE PRECISION,
  p_longitude DOUBLE PRECISION,
  p_radius_steps_km DOUBLE PRECISION[] DEFAULT ARRAY[15, 30, 50, 60],
  p_min_required INTEGER DEFAULT 6,
  p_limit INTEGER DEFAULT 9,
  p_category_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  id BIGINT,
  title TEXT,
  description TEXT,
  category_type VARCHAR(10),
  subcategory_slug VARCHAR(50),
  price_type VARCHAR(20),
  price_amount INTEGER,
  location_text TEXT,
  slug VARCHAR(200),
  main_image_url TEXT,
  event_date TIMESTAMPTZ,
  event_end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  distance_km DOUBLE PRECISION,
  effective_radius_km DOUBLE PRECISION
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_point geography;
  v_radius DOUBLE PRECISION;
  v_effective_radius DOUBLE PRECISION;
  v_count INTEGER;
  v_min_required INTEGER := GREATEST(COALESCE(p_min_required, 1), 1);
BEGIN
  v_point := ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography;
  v_effective_radius := p_radius_steps_km[array_length(p_radius_steps_km, 1)];

  FOREACH v_radius IN ARRAY p_radius_steps_km
  LOOP
    SELECT COUNT(*)::INTEGER
    INTO v_count
    FROM public.posts p
    WHERE public.is_post_publicly_visible(p.status, p.expires_at)
      AND NOT p.is_private
      AND (p_category_type IS NULL OR p.category_type = p_category_type)
      AND ST_DWithin(p.location, v_point, v_radius * 1000);

    IF v_count >= v_min_required THEN
      v_effective_radius := v_radius;
      EXIT;
    END IF;
  END LOOP;

  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.description,
    p.category_type,
    p.subcategory_slug,
    p.price_type,
    p.price_amount,
    p.location_text,
    p.slug,
    p.main_image_url,
    p.event_date,
    p.event_end_date,
    p.created_at,
    ROUND(
      (ST_Distance(p.location, v_point) / 1000.0)::numeric,
      1
    )::double precision AS distance_km,
    v_effective_radius AS effective_radius_km
  FROM public.posts p
  WHERE public.is_post_publicly_visible(p.status, p.expires_at)
    AND NOT p.is_private
    AND (p_category_type IS NULL OR p.category_type = p_category_type)
    AND ST_DWithin(p.location, v_point, v_effective_radius * 1000)
  ORDER BY
    CASE WHEN p.category_type = 'udalost' AND p.event_date IS NOT NULL THEN 0 ELSE 1 END,
    p.event_date ASC NULLS LAST,
    ST_Distance(p.location, v_point) ASC
  LIMIT LEAST(GREATEST(p_limit, 1), 50);
END;
$$;

REVOKE ALL ON FUNCTION public.get_nearby_posts(
  DOUBLE PRECISION,
  DOUBLE PRECISION,
  DOUBLE PRECISION[],
  INTEGER,
  INTEGER,
  TEXT
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_nearby_posts(
  DOUBLE PRECISION,
  DOUBLE PRECISION,
  DOUBLE PRECISION[],
  INTEGER,
  INTEGER,
  TEXT
) TO anon, authenticated;

DROP FUNCTION IF EXISTS public.search_posts(
  TEXT,
  TEXT,
  INTEGER,
  DOUBLE PRECISION,
  DOUBLE PRECISION
);

CREATE FUNCTION public.search_posts(
  p_query TEXT,
  p_category_type TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 36,
  p_latitude DOUBLE PRECISION DEFAULT NULL,
  p_longitude DOUBLE PRECISION DEFAULT NULL
)
RETURNS TABLE (
  id BIGINT,
  title TEXT,
  description TEXT,
  category_type VARCHAR(10),
  subcategory_slug VARCHAR(50),
  price_type VARCHAR(20),
  price_amount INTEGER,
  location_text TEXT,
  slug VARCHAR(200),
  main_image_url TEXT,
  event_date TIMESTAMPTZ,
  event_end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  distance_km DOUBLE PRECISION
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_query TEXT := trim(coalesce(p_query, ''));
  v_tsquery tsquery;
  v_point geography;
  v_prefix_text TEXT;
BEGIN
  IF char_length(v_query) < 3 THEN
    RETURN;
  END IF;

  SELECT string_agg(
    regexp_replace(word, '([&|!:()''\[\]\\])', '', 'g') || ':*',
    ' & '
  )
  INTO v_prefix_text
  FROM unnest(
    regexp_split_to_array(
      public.immutable_unaccent(
        lower(trim(regexp_replace(v_query, '\s+', ' ', 'g')))
      ),
      ' '
    )
  ) AS word
  WHERE length(word) >= 1;

  IF v_prefix_text IS NULL OR v_prefix_text = '' THEN
    RETURN;
  END IF;

  BEGIN
    v_tsquery := to_tsquery('simple', v_prefix_text);
  EXCEPTION
    WHEN OTHERS THEN
      RETURN;
  END;

  IF v_tsquery IS NULL OR v_tsquery = ''::tsquery THEN
    RETURN;
  END IF;

  IF p_latitude IS NOT NULL AND p_longitude IS NOT NULL THEN
    v_point := ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography;
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.description,
    p.category_type,
    p.subcategory_slug,
    p.price_type,
    p.price_amount,
    p.location_text,
    p.slug,
    p.main_image_url,
    p.event_date,
    p.event_end_date,
    p.created_at,
    CASE
      WHEN v_point IS NOT NULL THEN
        ROUND(
          (ST_Distance(p.location, v_point) / 1000.0)::numeric,
          1
        )::double precision
      ELSE NULL
    END AS distance_km
  FROM public.posts p
  WHERE public.is_post_publicly_visible(p.status, p.expires_at)
    AND NOT p.is_private
    AND (p_category_type IS NULL OR p.category_type = p_category_type)
    AND p.search_vector @@ v_tsquery
  ORDER BY
    ts_rank(p.search_vector, v_tsquery) DESC,
    CASE WHEN v_point IS NOT NULL THEN ST_Distance(p.location, v_point) END ASC NULLS LAST,
    p.created_at DESC
  LIMIT LEAST(GREATEST(p_limit, 1), 50);
END;
$$;

REVOKE ALL ON FUNCTION public.search_posts(
  TEXT,
  TEXT,
  INTEGER,
  DOUBLE PRECISION,
  DOUBLE PRECISION
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_posts(
  TEXT,
  TEXT,
  INTEGER,
  DOUBLE PRECISION,
  DOUBLE PRECISION
) TO anon, authenticated;

DROP FUNCTION IF EXISTS public.get_recent_posts(INTEGER, TEXT);

CREATE FUNCTION public.get_recent_posts(
  p_limit INTEGER DEFAULT 9,
  p_category_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  id BIGINT,
  title TEXT,
  description TEXT,
  category_type VARCHAR(10),
  subcategory_slug VARCHAR(50),
  price_type VARCHAR(20),
  price_amount INTEGER,
  location_text TEXT,
  slug VARCHAR(200),
  main_image_url TEXT,
  event_date TIMESTAMPTZ,
  event_end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.title,
    p.description,
    p.category_type,
    p.subcategory_slug,
    p.price_type,
    p.price_amount,
    p.location_text,
    p.slug,
    p.main_image_url,
    p.event_date,
    p.event_end_date,
    p.created_at
  FROM public.posts p
  WHERE public.is_post_publicly_visible(p.status, p.expires_at)
    AND NOT p.is_private
    AND (p_category_type IS NULL OR p.category_type = p_category_type)
  ORDER BY
    CASE WHEN p.category_type = 'udalost' AND p.event_date IS NOT NULL THEN 0 ELSE 1 END,
    p.event_date ASC NULLS LAST,
    p.created_at DESC
  LIMIT LEAST(GREATEST(p_limit, 1), 50);
$$;

REVOKE ALL ON FUNCTION public.get_recent_posts(INTEGER, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_recent_posts(INTEGER, TEXT)
  TO anon, authenticated;

DROP FUNCTION IF EXISTS public.get_advertiser_listings(TEXT, INTEGER, INTEGER);

CREATE FUNCTION public.get_advertiser_listings(
  p_nickname TEXT,
  p_limit INTEGER DEFAULT 9,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id BIGINT,
  title TEXT,
  description TEXT,
  category_type VARCHAR(10),
  subcategory_slug VARCHAR(50),
  price_type VARCHAR(20),
  price_amount INTEGER,
  location_text TEXT,
  slug VARCHAR(200),
  main_image_url TEXT,
  event_date TIMESTAMPTZ,
  event_end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_nick TEXT := NULLIF(trim(p_nickname), '');
  v_user_id UUID;
  v_limit INTEGER := LEAST(GREATEST(COALESCE(p_limit, 9), 1), 50);
  v_offset INTEGER := GREATEST(COALESCE(p_offset, 0), 0);
BEGIN
  IF v_nick IS NULL OR char_length(v_nick) > 50 THEN
    RETURN;
  END IF;

  SELECT p.id INTO v_user_id
  FROM public.profiles p
  WHERE p.nickname = v_nick;

  IF v_user_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    post.id,
    post.title,
    post.description,
    post.category_type,
    post.subcategory_slug,
    post.price_type,
    post.price_amount,
    post.location_text,
    post.slug,
    post.main_image_url,
    post.event_date,
    post.event_end_date,
    post.created_at
  FROM public.posts post
  WHERE post.user_id = v_user_id
    AND public.is_post_publicly_visible(post.status, post.expires_at)
    AND NOT post.is_private
  ORDER BY
    CASE
      WHEN post.category_type = 'udalost' AND post.event_date IS NOT NULL THEN 0
      ELSE 1
    END,
    post.event_date ASC NULLS LAST,
    post.created_at DESC
  LIMIT v_limit
  OFFSET v_offset;
END;
$$;

REVOKE ALL ON FUNCTION public.get_advertiser_listings(TEXT, INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_advertiser_listings(TEXT, INTEGER, INTEGER)
  TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_advertiser_public_by_nickname(
  p_nickname TEXT
)
RETURNS TABLE (
  nickname VARCHAR(50),
  is_company BOOLEAN,
  company_name VARCHAR(150),
  company_ico VARCHAR(8),
  lifetime_published_count INTEGER,
  active_listing_count INTEGER
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_nick TEXT := NULLIF(trim(p_nickname), '');
BEGIN
  IF v_nick IS NULL OR char_length(v_nick) > 50 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    p.nickname,
    p.is_company,
    p.company_name,
    p.company_ico,
    public.user_listing_lifetime_count(p.id),
    (
      SELECT count(*)::INTEGER
      FROM public.posts post
      WHERE post.user_id = p.id
        AND public.is_post_publicly_visible(post.status, post.expires_at)
        AND NOT post.is_private
    )
  FROM public.profiles p
  WHERE p.nickname = v_nick;
END;
$$;

-- -----------------------------------------------------------------------------
-- 4. Fail-closed — únik grantu / filtr = ROLLBACK
-- -----------------------------------------------------------------------------
SET LOCAL ROLE anon;
SELECT slug, title, is_private, event_end_date FROM public.posts LIMIT 1;
SELECT count(*) FROM public.get_nearby_posts(49.2, 16.6);
SELECT count(*) FROM public.search_posts('stolek');
RESET ROLE;

DO $$
DECLARE
  v_id BIGINT;
  v_title TEXT;
  v_query TEXT;
  v_found BOOLEAN;
BEGIN
  PERFORM set_config('role', 'anon', true);

  BEGIN
    EXECUTE 'SELECT is_private, event_end_date FROM public.posts LIMIT 1';
  EXCEPTION
    WHEN insufficient_privilege THEN
      RAISE EXCEPTION '082: anon nemůže číst is_private/event_end_date';
  END;

  BEGIN
    EXECUTE 'SELECT contact_phone FROM public.posts LIMIT 1';
    RAISE EXCEPTION '082: anon stále čte contact_phone';
  EXCEPTION
    WHEN insufficient_privilege THEN NULL;
  END;

  PERFORM set_config('role', 'authenticated', true);

  BEGIN
    EXECUTE 'SELECT is_private, event_end_date FROM public.posts LIMIT 1';
  EXCEPTION
    WHEN insufficient_privilege THEN
      RAISE EXCEPTION '082: authenticated nemůže číst is_private/event_end_date';
  END;

  PERFORM set_config('role', 'none', true);

  SELECT id, title INTO v_id, v_title
  FROM public.posts
  WHERE category_type = 'udalost'
    AND status = 'active'
    AND is_private = false
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE public.posts SET is_private = true WHERE id = v_id;

    SELECT EXISTS (
      SELECT 1
      FROM public.get_nearby_posts(
        49.2, 16.6, ARRAY[500]::double precision[], 1, 50
      ) n
      WHERE n.id = v_id
    ) INTO v_found;

    IF v_found THEN
      UPDATE public.posts SET is_private = false WHERE id = v_id;
      RAISE EXCEPTION '082: get_nearby_posts vrací soukromou událost';
    END IF;

    SELECT EXISTS (
      SELECT 1
      FROM public.get_recent_posts(50, 'udalost') r
      WHERE r.id = v_id
    ) INTO v_found;

    IF v_found THEN
      UPDATE public.posts SET is_private = false WHERE id = v_id;
      RAISE EXCEPTION '082: get_recent_posts vrací soukromou událost';
    END IF;

    v_query := left(regexp_replace(coalesce(v_title, ''), '\s+', ' ', 'g'), 40);
    IF char_length(trim(v_query)) >= 3 THEN
      SELECT EXISTS (
        SELECT 1
        FROM public.search_posts(v_query, 'udalost', 50) s
        WHERE s.id = v_id
      ) INTO v_found;

      IF v_found THEN
        UPDATE public.posts SET is_private = false WHERE id = v_id;
        RAISE EXCEPTION '082: search_posts vrací soukromou událost';
      END IF;
    END IF;

    UPDATE public.posts SET is_private = false WHERE id = v_id;
  END IF;
END;
$$;

COMMIT;
