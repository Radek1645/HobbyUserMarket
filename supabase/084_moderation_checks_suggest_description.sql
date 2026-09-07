-- =============================================================================
-- 084 — Prefill popis v moderation_checks
-- AI draft z suggest-listing-from-photos (ladění drop-offu). Ne create/update.
-- =============================================================================

BEGIN;

ALTER TABLE public.moderation_checks
  ADD COLUMN IF NOT EXISTS suggest_description TEXT;

ALTER TABLE public.moderation_checks
  DROP CONSTRAINT IF EXISTS moderation_checks_suggest_description_length;

ALTER TABLE public.moderation_checks
  ADD CONSTRAINT moderation_checks_suggest_description_length
  CHECK (
    suggest_description IS NULL
    OR char_length(suggest_description) <= 2000
  );

ALTER TABLE public.moderation_checks
  DROP CONSTRAINT IF EXISTS moderation_checks_suggest_description_intent;

ALTER TABLE public.moderation_checks
  ADD CONSTRAINT moderation_checks_suggest_description_intent
  CHECK (
    suggest_description IS NULL
    OR intent = 'suggest_from_photos'
  );

COMMENT ON COLUMN public.moderation_checks.suggest_description IS
  'Plný AI popis z Prefillu (intent suggest_from_photos). Create/update nechává NULL. Retence jako zbytek tabulky (12 měsíců).';

COMMIT;
