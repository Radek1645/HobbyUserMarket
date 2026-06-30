-- Adaptivní rádius pro homepage — kaskáda kroků, vrací effective_radius_km

-- Staré overloady z 011 (4 parametry) a 012 (5 parametrů) — oba musí pryč,
-- jinak v DB zůstanou dvě funkce se stejným názvem.
DROP FUNCTION IF EXISTS public.get_nearby_posts(
  DOUBLE PRECISION,
  DOUBLE PRECISION,
  DOUBLE PRECISION,
  INTEGER
);
DROP FUNCTION IF EXISTS public.get_nearby_posts(
  DOUBLE PRECISION,
  DOUBLE PRECISION,
  DOUBLE PRECISION,
  INTEGER,
  TEXT
);

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
SECURITY INVOKER
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

GRANT EXECUTE ON FUNCTION public.get_nearby_posts(
  DOUBLE PRECISION,
  DOUBLE PRECISION,
  DOUBLE PRECISION[],
  INTEGER,
  INTEGER,
  TEXT
) TO anon, authenticated;
