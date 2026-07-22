-- =============================================================================
-- 056 — Sightengine: plné JSON odpovědi (až 6 fotek) + view_count už existuje
-- Jeden jsonb sloupec = pole záznamů { imageIndex, response | error }.
-- =============================================================================

ALTER TABLE public.moderation_hard_reject_evidence
  ADD COLUMN IF NOT EXISTS sightengine_responses JSONB;

ALTER TABLE public.moderation_checks
  ADD COLUMN IF NOT EXISTS sightengine_responses JSONB;

COMMENT ON COLUMN public.moderation_hard_reject_evidence.sightengine_responses IS
  'Pole Sightengine odpovědí pro fotky v requestu (až 6): [{imageIndex, response?, error?}]';

COMMENT ON COLUMN public.moderation_checks.sightengine_responses IS
  'Pole Sightengine odpovědí pro fotky v requestu (až 6), pokud brána běžela.';
