-- =============================================================================
-- 083 — location nullable po úklidu PII (oprava 081)
--
-- apply_hidden_listing_pii_purge dělá UPDATE location = NULL. Sloupec byl
-- geography(POINT, 4326) NOT NULL → 23502. Cron 2026-09-01 04:31 proto spadl
-- až po smazání fotek ze storage (žádný rollback).
--
-- Živé stavy (draft/active/blocked/hidden) pořád musí mít bod.
-- location_text B1 nemaže — ulice zůstává do DELETE řádku po 12 měsících.
-- Žádný nový GRANT SELECT — location zůstává za RPC (079).
-- =============================================================================

BEGIN;

ALTER TABLE public.posts
  ALTER COLUMN location DROP NOT NULL;

ALTER TABLE public.posts
  DROP CONSTRAINT IF EXISTS posts_location_required_unless_archived_or_deleted;
ALTER TABLE public.posts
  ADD CONSTRAINT posts_location_required_unless_archived_or_deleted
  CHECK (
    location IS NOT NULL
    OR status IN ('archived', 'deleted')
  );

COMMENT ON COLUMN public.posts.location IS
  'WGS84 bod. NULL jen u archived/deleted po úklidu PII (30 dní). REST SELECT nemá (079).';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'posts'
      AND column_name = 'location'
      AND is_nullable = 'NO'
  ) THEN
    RAISE EXCEPTION '083: posts.location still NOT NULL';
  END IF;
END $$;

COMMIT;
