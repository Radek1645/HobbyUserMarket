-- =============================================================================
-- 078 — Column-level SELECT na posts (anon + authenticated)
--
-- Table-level GRANT SELECT z 006 přebíjí column-level REVOKE (contact_phone)
-- z 025: Postgres neodstraní table ACL sloupcovým REVOKE. Anon proto četl
-- všechny sloupce veřejných inzerátů — contact_phone, location (přesný bod)
-- i original_* (text před stripContactInfo).
--
-- Řešení: REVOKE table SELECT, pak GRANT jen sloupců, které aplikace reálně
-- selectuje. INSERT/UPDATE/DELETE zůstávají table-level (zápis contact_phone
-- při zakládání inzerátu dál funguje). service_role si table SELECT nechává.
--
-- get_nearby_posts / search_posts čtou location / search_vector → bez DEFINER
-- by homepage a hledání spadly na 42501. DEFINER obchází RLS: viditelnost
-- drží JEN is_post_publicly_visible v těle (loop i RETURN QUERY). Ten filtr
-- z funkce nesmí vypadnout. get_recent_posts zůstává INVOKER (location_text).
--
-- Fáze 2 (samostatná migrace): location + original_* za RPC own/staff,
-- pak je vyhodit i z authenticated allowlistu.
--
-- Před prvním spuštěním na produkci (samostatný dotaz, ne tato transakce):
--   SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args,
--          p.prosecdef AS is_definer
--   FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
--   WHERE n.nspname = 'public'
--     AND p.proname IN ('get_nearby_posts','search_posts','get_recent_posts')
--   ORDER BY 1, 2;
-- Čekáme 3 řádky po DROP starého get_recent_posts(integer). Víc = další overload.
-- =============================================================================

BEGIN;

-- 011/012 mají 2parametrové get_recent_posts; 1arg verze na produkci zbyla.
DROP FUNCTION IF EXISTS public.get_recent_posts(integer);

-- Zbytkový overload by CREATE OR REPLACE nenechal zmizet — abort dřív, než
-- REVOKE/GRANT změní ACL (ROLLBACK vrátí i to).
DO $$
DECLARE
  v_count integer;
BEGIN
  SELECT count(*) INTO v_count
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname IN ('get_nearby_posts', 'search_posts', 'get_recent_posts');

  IF v_count <> 3 THEN
    RAISE EXCEPTION
      '078 pre-flight: očekávány 3 funkce (nearby/search/recent), nalezeno %. Zbytkový overload — nejdřív DROP.',
      v_count;
  END IF;
END;
$$;

-- -----------------------------------------------------------------------------
-- 1. Table SELECT pryč; service_role nedotčen
-- -----------------------------------------------------------------------------
REVOKE SELECT ON public.posts FROM anon, authenticated;

-- anon: detail inzerátu, kategorie-SEO, sitemap, llms.txt, poptávka (createClient)
GRANT SELECT (
  id, user_id, title, description, description_ai_assisted,
  meta_description, image_alt, category_type, subcategory_slug,
  price_type, price_amount, exchange_for, condition_label,
  location_text, status, status_reason_code, event_date, external_url,
  show_contact_email, show_contact_phone, job_cv_required,
  expires_at, main_image_url, slug, view_count, created_at, updated_at
) ON public.posts TO anon;

-- authenticated: totéž + editace vlastního inzerátu a /mod
-- (location / original_* zůstanou do fáze 2 — čte je EDIT_COLUMNS)
GRANT SELECT (
  id, user_id, title, description, description_ai_assisted,
  meta_description, image_alt, category_type, subcategory_slug,
  price_type, price_amount, exchange_for, condition_label,
  location_text, status, status_reason_code, event_date, external_url,
  show_contact_email, show_contact_phone, job_cv_required,
  expires_at, main_image_url, slug, view_count, created_at, updated_at,
  original_title, original_description, location, deletion_reason,
  listing_duration_days, listing_quota_consumed,
  publish_request_id, publish_started_at, renew_count, payment_status
) ON public.posts TO authenticated;

-- Nový sloupec na posts automaticky NENÍ v allowlistu — doplň GRANT v téže migraci.

-- -----------------------------------------------------------------------------
-- 2. Nearby / search musí číst location a search_vector bez grantu na REST
--    DEFINER + is_post_publicly_visible v loopu i v RETURN QUERY (ne RLS).
-- -----------------------------------------------------------------------------
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
    p.created_at,
    ROUND(
      (ST_Distance(p.location, v_point) / 1000.0)::numeric,
      1
    )::double precision AS distance_km,
    v_effective_radius AS effective_radius_km
  FROM public.posts p
  WHERE public.is_post_publicly_visible(p.status, p.expires_at)
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

-- -----------------------------------------------------------------------------
-- 3. Ověření v téže transakci — selhání = ROLLBACK (anon bez SELECT = web dolů)
-- -----------------------------------------------------------------------------
SET LOCAL ROLE anon;
SELECT slug, title FROM public.posts LIMIT 1;
SELECT count(*) FROM public.get_nearby_posts(49.2, 16.6);
SELECT count(*) FROM public.search_posts('stolek');
RESET ROLE;

-- 42501 nesmí abortovat skript; úspěšný SELECT = únik → RAISE → ROLLBACK
DO $$
BEGIN
  PERFORM set_config('role', 'anon', true);

  BEGIN
    EXECUTE 'SELECT contact_phone FROM public.posts LIMIT 1';
    RAISE EXCEPTION '078: anon stále čte contact_phone';
  EXCEPTION
    WHEN insufficient_privilege THEN NULL;
  END;

  BEGIN
    EXECUTE 'SELECT location FROM public.posts LIMIT 1';
    RAISE EXCEPTION '078: anon stále čte location';
  EXCEPTION
    WHEN insufficient_privilege THEN NULL;
  END;

  BEGIN
    EXECUTE 'SELECT original_description FROM public.posts LIMIT 1';
    RAISE EXCEPTION '078: anon stále čte original_description';
  EXCEPTION
    WHEN insufficient_privilege THEN NULL;
  END;

  PERFORM set_config('role', 'none', true);
END;
$$;

-- DEFINER nesmí vrátit draft/hidden/blocked (prázdný výsledek = OK)
DO $$
DECLARE
  v_status public.post_status;
BEGIN
  SELECT p.status INTO v_status
  FROM public.get_nearby_posts(
    49.2, 16.6, ARRAY[500]::double precision[], 1, 50
  ) n
  JOIN public.posts p ON p.id = n.id
  WHERE p.status IS DISTINCT FROM 'active'::public.post_status
  LIMIT 1;

  IF FOUND THEN
    RAISE EXCEPTION
      '078: get_nearby_posts vrací status % — vrať SECURITY INVOKER',
      v_status;
  END IF;
END;
$$;

COMMIT;

-- Rollback po nasazení (vrátí table SELECT = únik; RPC nech DEFINER):
--   GRANT SELECT ON public.posts TO anon, authenticated;
