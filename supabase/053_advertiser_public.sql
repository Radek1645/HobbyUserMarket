-- =============================================================================
-- 053 — Veřejná data zadavatele: lifetime count, profil podle nickname, inzeráty
-- Badge Podnikatel / milníky na detailu + stránka /uzivatel/[nickname].
-- Bezpečně opakovatelné.
-- =============================================================================

-- Rozšířený RETURNS TABLE → DROP + CREATE
DROP FUNCTION IF EXISTS public.get_advertiser_display(UUID);

CREATE OR REPLACE FUNCTION public.get_advertiser_display(p_user_id UUID)
RETURNS TABLE (
  nickname VARCHAR(50),
  is_company BOOLEAN,
  company_name VARCHAR(150),
  company_ico VARCHAR(8),
  lifetime_published_count INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.nickname,
    p.is_company,
    p.company_name,
    p.company_ico,
    public.user_listing_lifetime_count(p.id)
  FROM public.profiles p
  WHERE p.id = p_user_id;
$$;

REVOKE ALL ON FUNCTION public.get_advertiser_display(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_advertiser_display(UUID) TO anon, authenticated;

COMMENT ON FUNCTION public.get_advertiser_display(UUID) IS
  'Veřejná ne-PII data zadavatele + lifetime publikací pro odznaky.';

-- ---------------------------------------------------------------------------
-- Profil podle nickname (bez e-mailu / telefonu)
-- ---------------------------------------------------------------------------

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
    )
  FROM public.profiles p
  WHERE p.nickname = v_nick;
END;
$$;

REVOKE ALL ON FUNCTION public.get_advertiser_public_by_nickname(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_advertiser_public_by_nickname(TEXT)
  TO anon, authenticated;

COMMENT ON FUNCTION public.get_advertiser_public_by_nickname(TEXT) IS
  'Veřejný přehled zadavatele podle nickname (bez PII).';

-- ---------------------------------------------------------------------------
-- Aktivní inzeráty zadavatele (tvar náhledu jako get_recent_posts)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_advertiser_listings(
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
    post.created_at
  FROM public.posts post
  WHERE post.user_id = v_user_id
    AND public.is_post_publicly_visible(post.status, post.expires_at)
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

COMMENT ON FUNCTION public.get_advertiser_listings(TEXT, INTEGER, INTEGER) IS
  'Veřejné aktivní inzeráty zadavatele podle nickname (paginace).';
