-- =============================================================================
-- 058 — AI návrh kategorie/podkategorie (telemetrie pro rozšíření taxonomie)
-- Append-only metadata v moderation_checks. Nezakládá nové kategorie automaticky.
-- =============================================================================

ALTER TABLE public.moderation_checks
  ADD COLUMN IF NOT EXISTS category_fit TEXT,
  ADD COLUMN IF NOT EXISTS suggested_category_type TEXT,
  ADD COLUMN IF NOT EXISTS suggested_subcategory_slug TEXT,
  ADD COLUMN IF NOT EXISTS category_taxonomy_hint TEXT;

ALTER TABLE public.moderation_checks
  DROP CONSTRAINT IF EXISTS moderation_checks_category_fit_check;

ALTER TABLE public.moderation_checks
  ADD CONSTRAINT moderation_checks_category_fit_check
  CHECK (
    category_fit IS NULL
    OR category_fit IN ('match', 'better_existing', 'missing_taxonomy')
  );

COMMENT ON COLUMN public.moderation_checks.category_fit IS
  'AI: match = volba OK; better_existing = lepší existující pár; missing_taxonomy = chybí podkategorie (hint).';
COMMENT ON COLUMN public.moderation_checks.suggested_category_type IS
  'AI návrh category_type (jen existující slugy z katalogu).';
COMMENT ON COLUMN public.moderation_checks.suggested_subcategory_slug IS
  'AI návrh subcategory_slug (jen existující slugy z katalogu).';
COMMENT ON COLUMN public.moderation_checks.category_taxonomy_hint IS
  'AI volný popis chybějící podkategorie (česky) — podklad pro ruční rozšíření.';

CREATE INDEX IF NOT EXISTS moderation_checks_category_fit_idx
  ON public.moderation_checks (category_fit, created_at DESC)
  WHERE category_fit IS NOT NULL AND category_fit <> 'match';
