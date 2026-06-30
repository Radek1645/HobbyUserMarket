-- Fulltext vyhledávání inzerátů (PRD §5.2) — tsvector + GIN index na posts.search_vector

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
SECURITY INVOKER
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

  -- Prefix match: „tri“ najde „Tričko“, „kol“ najde „Kolo“ (každé slovo + :*)
  SELECT string_agg(
    regexp_replace(word, '([&|!:()''\[\]\\])', '', 'g') || ':*',
    ' & '
  )
  INTO v_prefix_text
  FROM unnest(
    regexp_split_to_array(
      lower(trim(regexp_replace(v_query, '\s+', ' ', 'g'))),
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

GRANT EXECUTE ON FUNCTION public.search_posts(
  TEXT,
  TEXT,
  INTEGER,
  DOUBLE PRECISION,
  DOUBLE PRECISION
) TO anon, authenticated;
