-- =============================================================================
-- 068 — Důvěryhodné AI varianty obrázků generované přes Sharp
--
-- Bucket nemá policy pro authenticated. Čte a zapisuje jej pouze service_role:
-- Next.js Server Action vytvoří varianty z immutable originálu, Edge je načte.
-- =============================================================================

INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'moderation-image-renditions',
  'moderation-image-renditions',
  false,
  1048576,
  ARRAY['image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS moderation_image_renditions_select ON storage.objects;
DROP POLICY IF EXISTS moderation_image_renditions_insert ON storage.objects;
DROP POLICY IF EXISTS moderation_image_renditions_update ON storage.objects;
DROP POLICY IF EXISTS moderation_image_renditions_delete ON storage.objects;
