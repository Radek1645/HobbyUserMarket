-- =============================================================================
-- 028 — Log AI moderace (dohledatelné v Table Editoru / God Mode)
-- Append-only záznam každého volání moderate-listing (service_role INSERT).
-- Bez plného textu inzerátu — jen metadata + title_preview pro orientaci.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.moderation_checks (
  log_no               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id              UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  intent               TEXT,
  status               TEXT NOT NULL,
  category_type        TEXT,
  subcategory_slug     TEXT,
  image_count          SMALLINT NOT NULL DEFAULT 0,
  rejected_topic_id    TEXT,
  rejection_reason     TEXT,
  rejected_image_index SMALLINT,
  error_code           TEXT,
  title_preview        TEXT,

  CONSTRAINT moderation_checks_status_check
    CHECK (status IN ('APPROVED', 'REJECTED', 'NEEDS_QUESTIONS')),
  CONSTRAINT moderation_checks_image_count_check
    CHECK (image_count BETWEEN 0 AND 6)
);

CREATE INDEX IF NOT EXISTS moderation_checks_created_at_idx
  ON public.moderation_checks (created_at DESC);

CREATE INDEX IF NOT EXISTS moderation_checks_user_idx
  ON public.moderation_checks (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS moderation_checks_rejected_idx
  ON public.moderation_checks (created_at DESC)
  WHERE status = 'REJECTED';

ALTER TABLE public.moderation_checks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS moderation_checks_select_moderator ON public.moderation_checks;
CREATE POLICY moderation_checks_select_moderator ON public.moderation_checks
  FOR SELECT TO authenticated
  USING (public.is_moderator_or_admin());

GRANT INSERT, SELECT ON public.moderation_checks TO service_role;
