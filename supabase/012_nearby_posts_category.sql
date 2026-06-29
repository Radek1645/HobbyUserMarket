-- Volitelný filtr kategorie pro homepage výpis

CREATE OR REPLACE FUNCTION public.get_nearby_posts(
  p_latitude DOUBLE PRECISION,
  p_longitude DOUBLE PRECISION,
  p_radius_km DOUBLE PRECISION DEFAULT 15,
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
  distance_km DOUBLE PRECISION
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, extensions
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
    p.created_at,
    ROUND(
      (ST_Distance(
        p.location,
        ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography
      ) / 1000.0)::numeric,
      1
    )::double precision AS distance_km
  FROM public.posts p
  WHERE public.is_post_publicly_visible(p.status, p.expires_at)
    AND (p_category_type IS NULL OR p.category_type = p_category_type)
    AND ST_DWithin(
      p.location,
      ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography,
      p_radius_km * 1000
    )
  ORDER BY
    CASE WHEN p.category_type = 'udalost' AND p.event_date IS NOT NULL THEN 0 ELSE 1 END,
    p.event_date ASC NULLS LAST,
    ST_Distance(
      p.location,
      ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography
    ) ASC
  LIMIT LEAST(GREATEST(p_limit, 1), 50);
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
    p.created_at
  FROM public.posts p
  WHERE public.is_post_publicly_visible(p.status, p.expires_at)
    AND (p_category_type IS NULL OR p.category_type = p_category_type)
  ORDER BY
    CASE WHEN p.category_type = 'udalost' AND p.event_date IS NOT NULL THEN 0 ELSE 1 END,
    p.event_date ASC NULLS LAST,
    p.created_at DESC
  LIMIT LEAST(GREATEST(p_limit, 1), 50);
$$;
