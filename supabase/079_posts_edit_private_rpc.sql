-- =============================================================================
-- 079 — Fáze 2: location + original_* jen přes RPC (vlastník / staff)
--
-- Po 078 má authenticated pořád SELECT na location a original_* u každého
-- řádku, který pustí RLS (veřejné inzeráty). Stačí free účet.
--
-- Čtení přes SECURITY DEFINER RPC (stejný vzor jako get_owned_post_contact_phone).
-- INSERT/UPDATE těch sloupců zůstává table-level (zakládání / úprava inzerátu).
-- =============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.get_post_edit_private_fields(p_post_id BIGINT)
RETURNS TABLE (
  original_title TEXT,
  original_description TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    p.original_title,
    p.original_description,
    extensions.ST_Y(p.location::extensions.geometry),
    extensions.ST_X(p.location::extensions.geometry)
  FROM public.posts p
  WHERE p.id = p_post_id
    AND (
      p.user_id = auth.uid()
      OR public.is_moderator_or_admin()
    );
END;
$$;

REVOKE ALL ON FUNCTION public.get_post_edit_private_fields(BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_post_edit_private_fields(BIGINT)
  TO authenticated;

COMMENT ON FUNCTION public.get_post_edit_private_fields(BIGINT) IS
  'GPS + original_* pro editaci inzerátu. Jen vlastník nebo staff — ne REST SELECT.';

REVOKE SELECT ON public.posts FROM authenticated;
GRANT SELECT (
  id, user_id, title, description, description_ai_assisted,
  meta_description, image_alt, category_type, subcategory_slug,
  price_type, price_amount, exchange_for, condition_label,
  location_text, status, status_reason_code, event_date, external_url,
  show_contact_email, show_contact_phone, job_cv_required,
  expires_at, main_image_url, slug, view_count, created_at, updated_at,
  deletion_reason, listing_duration_days, listing_quota_consumed,
  publish_request_id, publish_started_at, renew_count, payment_status
) ON public.posts TO authenticated;

-- -----------------------------------------------------------------------------
-- Ověření — únik = ROLLBACK. SQL Editor nemá JWT, RPC proto vrátí 0 řádků.
-- -----------------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SELECT slug, title FROM public.posts LIMIT 1;
RESET ROLE;

DO $$
BEGIN
  PERFORM set_config('role', 'authenticated', true);

  BEGIN
    EXECUTE 'SELECT location FROM public.posts LIMIT 1';
    RAISE EXCEPTION '079: authenticated stále čte location';
  EXCEPTION
    WHEN insufficient_privilege THEN NULL;
  END;

  BEGIN
    EXECUTE 'SELECT original_title FROM public.posts LIMIT 1';
    RAISE EXCEPTION '079: authenticated stále čte original_title';
  EXCEPTION
    WHEN insufficient_privilege THEN NULL;
  END;

  BEGIN
    EXECUTE 'SELECT original_description FROM public.posts LIMIT 1';
    RAISE EXCEPTION '079: authenticated stále čte original_description';
  EXCEPTION
    WHEN insufficient_privilege THEN NULL;
  END;

  PERFORM set_config('role', 'none', true);
END;
$$;

COMMIT;

-- Rollback po nasazení (vrátí authenticated SELECT na location/original_*):
--   GRANT SELECT (location, original_title, original_description)
--     ON public.posts TO authenticated;
