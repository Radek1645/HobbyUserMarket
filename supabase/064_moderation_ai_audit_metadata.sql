-- =============================================================================
-- 064 — auditní identita AI rozhodnutí
-- =============================================================================

ALTER TABLE public.moderation_checks
  ADD COLUMN IF NOT EXISTS prompt_version TEXT,
  ADD COLUMN IF NOT EXISTS ai_provider TEXT,
  ADD COLUMN IF NOT EXISTS ai_model TEXT,
  ADD COLUMN IF NOT EXISTS used_fallback BOOLEAN,
  ADD COLUMN IF NOT EXISTS policy_hash TEXT,
  ADD COLUMN IF NOT EXISTS input_fingerprint TEXT,
  ADD COLUMN IF NOT EXISTS image_hashes TEXT[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.moderation_checks.prompt_version IS
  'Verze moderačního prompt contractu použitá pro rozhodnutí.';
COMMENT ON COLUMN public.moderation_checks.policy_hash IS
  'SHA-256 přesného system promptu odeslaného providerovi.';
COMMENT ON COLUMN public.moderation_checks.input_fingerprint IS
  'SHA-256 kanonického vstupu, ke kterému se rozhodnutí vztahuje.';
COMMENT ON COLUMN public.moderation_checks.image_hashes IS
  'SHA-256 fotografií v pořadí odeslaném AI.';

CREATE INDEX IF NOT EXISTS moderation_checks_input_fingerprint_idx
  ON public.moderation_checks (input_fingerprint)
  WHERE input_fingerprint IS NOT NULL;
