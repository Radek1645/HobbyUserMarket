-- =============================================================================
-- 040 — Nahlášení v0.5: standalone formulář, rozšířené důvody, volitelný popis
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE public.report_source AS ENUM ('inline', 'standalone');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE public.report_reason ADD VALUE IF NOT EXISTS 'sexual';
ALTER TYPE public.report_reason ADD VALUE IF NOT EXISTS 'drugs';
ALTER TYPE public.report_reason ADD VALUE IF NOT EXISTS 'spam';
ALTER TYPE public.report_reason ADD VALUE IF NOT EXISTS 'misconduct';
ALTER TYPE public.report_reason ADD VALUE IF NOT EXISTS 'other';

ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS source public.report_source NOT NULL DEFAULT 'inline',
  ADD COLUMN IF NOT EXISTS detail_text TEXT,
  ADD COLUMN IF NOT EXISTS reporter_email TEXT;

ALTER TABLE public.reports
  ALTER COLUMN reporter_user_id DROP NOT NULL;

ALTER TABLE public.reports
  DROP CONSTRAINT IF EXISTS reports_detail_text_length;

ALTER TABLE public.reports
  ADD CONSTRAINT reports_detail_text_length
  CHECK (detail_text IS NULL OR char_length(detail_text) <= 500);

ALTER TABLE public.reports
  DROP CONSTRAINT IF EXISTS reports_reporter_identity;

ALTER TABLE public.reports
  ADD CONSTRAINT reports_reporter_identity
  CHECK (
    reporter_user_id IS NOT NULL
    OR (
      source = 'standalone'
      AND reporter_email IS NOT NULL
      AND char_length(trim(reporter_email)) > 0
    )
  );

CREATE UNIQUE INDEX IF NOT EXISTS reports_one_email_per_post_idx
  ON public.reports (lower(trim(reporter_email)), target_post_id)
  WHERE source = 'standalone'
    AND target_post_id IS NOT NULL
    AND reporter_email IS NOT NULL;
