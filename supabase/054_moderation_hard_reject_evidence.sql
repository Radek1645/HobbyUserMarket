-- =============================================================================
-- 054 — NSFW / hard-hit evidence (před Gemini), privátní bucket
-- Evidence bez post_id — moderate-listing běží před createListing.
-- Nesouvisí s /mod/karantena (blocked inzeráty).
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.moderation_hard_reject_evidence (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_no        BIGINT GENERATED ALWAYS AS IDENTITY,
  user_id            UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  kind               TEXT NOT NULL,
  matched_category   TEXT,
  reason             TEXT,
  matched_term       TEXT,
  title_snippet      TEXT,
  storage_path       TEXT,
  image_index        SMALLINT,

  CONSTRAINT moderation_hard_reject_evidence_kind_check
    CHECK (kind IN (
      'hard_hit_text',
      'nsfw_image',
      'sightengine_unavailable',
      'hard_reject_threshold_reached'
    )),
  CONSTRAINT moderation_hard_reject_evidence_image_index_check
    CHECK (image_index IS NULL OR image_index BETWEEN 0 AND 5)
);

CREATE UNIQUE INDEX IF NOT EXISTS moderation_hard_reject_evidence_no_idx
  ON public.moderation_hard_reject_evidence (evidence_no);

CREATE INDEX IF NOT EXISTS moderation_hard_reject_evidence_user_created_idx
  ON public.moderation_hard_reject_evidence (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS moderation_hard_reject_evidence_kind_created_idx
  ON public.moderation_hard_reject_evidence (kind, created_at DESC);

ALTER TABLE public.moderation_hard_reject_evidence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS moderation_hard_reject_evidence_select_moderator
  ON public.moderation_hard_reject_evidence;
CREATE POLICY moderation_hard_reject_evidence_select_moderator
  ON public.moderation_hard_reject_evidence
  FOR SELECT TO authenticated
  USING (public.is_moderator_or_admin());

GRANT INSERT, SELECT ON public.moderation_hard_reject_evidence TO service_role;

-- Privátní bucket pro snapshoty NSFW fotek (jen service_role přes API key).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'moderation-evidence',
  'moderation-evidence',
  false,
  524288,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Žádné veřejné / authenticated policies na objects — přístup jen service_role.
DROP POLICY IF EXISTS moderation_evidence_storage_select ON storage.objects;
DROP POLICY IF EXISTS moderation_evidence_storage_insert ON storage.objects;
DROP POLICY IF EXISTS moderation_evidence_storage_update ON storage.objects;
DROP POLICY IF EXISTS moderation_evidence_storage_delete ON storage.objects;
