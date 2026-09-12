-- =============================================================================
-- 088 — Strop výpisu inzerátů 50 → 200 (HP / nearby / search)
-- App zrcadlo: HOME_LISTINGS_FETCH_LIMIT v src/config/app.ts
-- Signatury beze změny — CREATE OR REPLACE, granty zůstávají.
-- =============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.get_nearby_posts(
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
  LIMIT LEAST(GREATEST(p_limit, 1), 200);
END;
$$;

CREATE OR REPLACE FUNCTION public.search_posts(
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
  LIMIT LEAST(GREATEST(p_limit, 1), 200);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_recent_posts(
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
  LIMIT LEAST(GREATEST(p_limit, 1), 200);
$$;

-- CREATE OR REPLACE nemění prosecdef spolehlivě; ALTER to drží explicitně.
-- DO blok bere všechny overloady podle jména — ne řetězec identity args
-- (`double precision[]` vs `_float8` na produkci shodil první běh).
ALTER FUNCTION public.get_nearby_posts(
  DOUBLE PRECISION,
  DOUBLE PRECISION,
  DOUBLE PRECISION[],
  INTEGER,
  INTEGER,
  TEXT
) SECURITY DEFINER SET search_path = public, extensions;

ALTER FUNCTION public.search_posts(
  TEXT,
  TEXT,
  INTEGER,
  DOUBLE PRECISION,
  DOUBLE PRECISION
) SECURITY DEFINER SET search_path = public, extensions;

ALTER FUNCTION public.get_recent_posts(INTEGER, TEXT)
  SECURITY INVOKER SET search_path = public;

DO $$
DECLARE
  r record;
  v_nearby integer := 0;
  v_search integer := 0;
  v_recent integer := 0;
BEGIN
  FOR r IN
    SELECT p.proname,
           pg_get_function_identity_arguments(p.oid) AS args,
           p.prosecdef AS is_definer
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'get_nearby_posts',
        'search_posts',
        'get_recent_posts'
      )
    ORDER BY 1, 2
  LOOP
    IF r.proname = 'get_nearby_posts' THEN
      IF NOT r.is_definer THEN
        RAISE EXCEPTION
          '088: get_nearby_posts(%) je INVOKER, musí DEFINER',
          r.args;
      END IF;
      v_nearby := v_nearby + 1;
    ELSIF r.proname = 'search_posts' THEN
      IF NOT r.is_definer THEN
        RAISE EXCEPTION
          '088: search_posts(%) je INVOKER, musí DEFINER',
          r.args;
      END IF;
      v_search := v_search + 1;
    ELSE
      IF r.is_definer THEN
        RAISE EXCEPTION
          '088: get_recent_posts(%) je DEFINER, musí INVOKER',
          r.args;
      END IF;
      v_recent := v_recent + 1;
    END IF;
  END LOOP;

  IF v_nearby = 0 THEN
    RAISE EXCEPTION '088: get_nearby_posts v public chybí';
  END IF;
  IF v_search = 0 THEN
    RAISE EXCEPTION '088: search_posts v public chybí';
  END IF;
  IF v_recent = 0 THEN
    RAISE EXCEPTION '088: get_recent_posts v public chybí';
  END IF;
END;
$$;

COMMIT;
