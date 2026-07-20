-- =============================================================================
-- 052 — Zobrazení detailu inzerátu (klientské statistiky, mimo GA4)
-- Event log + denormalizovaný posts.view_count. Dedup 24 h / viewer_key.
-- INSERT jen přes SECURITY DEFINER RPC (volá API route se service_role).
-- Majitel čte jen posts.view_count — ne jednotlivé řádky (bez identifikace prohlížečů).
-- Bezpečně opakovatelné.
-- =============================================================================

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.posts
  DROP CONSTRAINT IF EXISTS posts_view_count_non_negative;

ALTER TABLE public.posts
  ADD CONSTRAINT posts_view_count_non_negative
  CHECK (view_count >= 0);

COMMENT ON COLUMN public.posts.view_count IS
  'Počet započítaných zobrazení detailu (dedup 24 h / viewer_key).';

CREATE TABLE IF NOT EXISTS public.listing_views (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  view_no         BIGINT GENERATED ALWAYS AS IDENTITY,
  post_id         BIGINT NOT NULL REFERENCES public.posts (id) ON DELETE CASCADE,
  viewer_user_id  UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  viewer_key      TEXT NOT NULL,
  ip_hash         TEXT NOT NULL,
  viewed_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT listing_views_viewer_key_not_empty
    CHECK (char_length(trim(viewer_key)) > 0),
  CONSTRAINT listing_views_ip_hash_not_empty
    CHECK (char_length(trim(ip_hash)) > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS listing_views_view_no_idx
  ON public.listing_views (view_no);

CREATE INDEX IF NOT EXISTS listing_views_post_viewed_idx
  ON public.listing_views (post_id, viewed_at DESC);

CREATE INDEX IF NOT EXISTS listing_views_dedup_idx
  ON public.listing_views (post_id, viewer_key, viewed_at DESC);

CREATE INDEX IF NOT EXISTS listing_views_ip_hash_viewed_idx
  ON public.listing_views (ip_hash, viewed_at DESC);

ALTER TABLE public.listing_views ENABLE ROW LEVEL SECURITY;

-- Jen moderátor / admin (God Mode). Majitel má agregát na posts.view_count.
DROP POLICY IF EXISTS listing_views_select_moderator ON public.listing_views;
CREATE POLICY listing_views_select_moderator ON public.listing_views
  FOR SELECT TO authenticated
  USING (public.is_moderator_or_admin());

GRANT SELECT ON public.listing_views TO authenticated;
GRANT SELECT, INSERT ON public.listing_views TO service_role;
GRANT UPDATE (view_count) ON public.posts TO service_role;

-- Záznam zobrazení: viditelný inzerát, ne majitel, dedup 24 h, ++ view_count.
CREATE OR REPLACE FUNCTION public.record_listing_view(
  p_post_id BIGINT,
  p_viewer_key TEXT,
  p_ip_hash TEXT,
  p_viewer_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_post       RECORD;
  v_key        TEXT := NULLIF(trim(p_viewer_key), '');
  v_ip_hash    TEXT := NULLIF(trim(p_ip_hash), '');
  v_dedup_hrs  INTEGER := 24;
BEGIN
  IF p_post_id IS NULL OR p_post_id < 1 OR v_key IS NULL OR v_ip_hash IS NULL THEN
    RETURN false;
  END IF;

  IF char_length(v_key) > 128 OR char_length(v_ip_hash) > 128 THEN
    RETURN false;
  END IF;

  SELECT p.user_id, p.status, p.expires_at
    INTO v_post
  FROM public.posts p
  WHERE p.id = p_post_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF NOT public.is_post_publicly_visible(v_post.status, v_post.expires_at) THEN
    RETURN false;
  END IF;

  -- Vlastní zobrazení se nepočítá (náhled majitele).
  IF p_viewer_user_id IS NOT NULL AND p_viewer_user_id = v_post.user_id THEN
    RETURN false;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.listing_views lv
    WHERE lv.post_id = p_post_id
      AND lv.viewer_key = v_key
      AND lv.viewed_at > now() - make_interval(hours => v_dedup_hrs)
  ) THEN
    RETURN false;
  END IF;

  INSERT INTO public.listing_views (post_id, viewer_user_id, viewer_key, ip_hash)
  VALUES (p_post_id, p_viewer_user_id, v_key, v_ip_hash);

  UPDATE public.posts
  SET view_count = view_count + 1
  WHERE id = p_post_id;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.record_listing_view(BIGINT, TEXT, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_listing_view(BIGINT, TEXT, TEXT, UUID) TO service_role;

COMMENT ON FUNCTION public.record_listing_view(BIGINT, TEXT, TEXT, UUID) IS
  'Zapíše zobrazení detailu inzerátu (dedup 24 h). Volá jen service_role z API.';
