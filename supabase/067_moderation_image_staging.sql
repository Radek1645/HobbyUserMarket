-- =============================================================================
-- 067 — Privátní staging fotografií pro rychlou a bezpečnou AI moderaci
--
-- Originál (už klientsky zmenšený na Storage limit) se nahraje jen jednou.
-- Edge Function jej ze stagingu sama stáhne a spočítá autoritativní SHA-256
-- pro SEC-H02. AI varianty vytváří Sharp Server Action (navazující migrace 068).
-- =============================================================================

INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'moderation-image-staging',
  'moderation-image-staging',
  false,
  1048576,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS moderation_image_staging_select_own ON storage.objects;
CREATE POLICY moderation_image_staging_select_own ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'moderation-image-staging'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS moderation_image_staging_insert_own ON storage.objects;
CREATE POLICY moderation_image_staging_insert_own ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'moderation-image-staging'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Záměrně bez UPDATE i DELETE: uživatel po načtení Edge Function nemůže
-- objekt na stejném path vyměnit (TOCTOU). Úklid provádí jen service_role.
DROP POLICY IF EXISTS moderation_image_staging_update_own ON storage.objects;

DROP POLICY IF EXISTS moderation_image_staging_delete_own ON storage.objects;

-- -----------------------------------------------------------------------------
-- Approval navíc váže mainImageIndex. Samotné pořadí SHA-256 nestačí, protože
-- změna hlavní fotky nemění bajty ani jejich pořadí.
-- -----------------------------------------------------------------------------
ALTER TABLE public.moderation_approvals
  ADD COLUMN IF NOT EXISTS main_image_index SMALLINT NOT NULL DEFAULT -1;

CREATE OR REPLACE FUNCTION public.issue_moderation_approval(
  p_user_id             UUID,
  p_image_count         INTEGER,
  p_content_fingerprint TEXT,
  p_image_hashes        TEXT[],
  p_main_image_index    INTEGER
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_image_count INTEGER :=
    GREATEST(0, LEAST(6, COALESCE(p_image_count, 0)));
  v_main_image_index INTEGER := COALESCE(p_main_image_index, -1);
  v_token UUID;
BEGIN
  IF cardinality(COALESCE(p_image_hashes, '{}')) <> v_image_count THEN
    RAISE EXCEPTION 'image_hash_set_invalid' USING errcode = '22023';
  END IF;

  IF (v_image_count = 0 AND v_main_image_index <> -1)
     OR (v_image_count > 0 AND (
       v_main_image_index < 0 OR v_main_image_index >= v_image_count
     )) THEN
    RAISE EXCEPTION 'main_image_index_invalid' USING errcode = '22023';
  END IF;

  INSERT INTO public.moderation_approvals (
    user_id,
    image_count,
    content_fingerprint,
    image_hashes,
    main_image_index
  )
  VALUES (
    p_user_id,
    v_image_count,
    COALESCE(p_content_fingerprint, ''),
    COALESCE(p_image_hashes, '{}'),
    v_main_image_index
  )
  RETURNING token INTO v_token;

  RETURN v_token;
END;
$$;

REVOKE ALL ON FUNCTION public.issue_moderation_approval(
  UUID, INTEGER, TEXT, TEXT[], INTEGER
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.issue_moderation_approval(
  UUID, INTEGER, TEXT, TEXT[], INTEGER
) TO service_role;

CREATE OR REPLACE FUNCTION public.publish_approved_post(
  p_post_id        BIGINT,
  p_token          UUID,
  p_user_id        UUID,
  p_target         TEXT DEFAULT 'active',
  p_image_bindings JSONB DEFAULT '[]'::jsonb
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_approval          RECORD;
  v_post_owner        UUID;
  v_post_status       public.post_status;
  v_main_image_url    TEXT;
  v_image_count       INTEGER;
  v_post_fingerprint  TEXT;
  v_db_bindings       JSONB;
  v_supplied_identity JSONB;
  v_supplied_hashes   TEXT[];
  v_expected_main_url TEXT;
  v_main_image_index  INTEGER;
BEGIN
  IF jsonb_typeof(COALESCE(p_image_bindings, '[]'::jsonb)) <> 'array' THEN
    RAISE EXCEPTION 'image_bindings_invalid' USING errcode = '22023';
  END IF;

  IF p_target NOT IN ('active', 'hidden') THEN
    RAISE EXCEPTION 'invalid_publish_target' USING errcode = '22023';
  END IF;

  SELECT user_id, status, main_image_url
  INTO v_post_owner, v_post_status, v_main_image_url
  FROM public.posts
  WHERE id = p_post_id
  FOR UPDATE;

  IF NOT FOUND OR v_post_owner <> p_user_id THEN
    RAISE EXCEPTION 'post_not_owned' USING errcode = '42501';
  END IF;

  IF v_post_status <> 'draft' THEN
    RAISE EXCEPTION 'post_not_draft' USING errcode = '42501';
  END IF;

  SELECT *
  INTO v_approval
  FROM public.moderation_approvals
  WHERE token = p_token
  FOR UPDATE;

  IF NOT FOUND
     OR v_approval.user_id <> p_user_id
     OR v_approval.consumed_at IS NOT NULL
     OR v_approval.expires_at < now() THEN
    RAISE EXCEPTION 'invalid_or_expired_approval' USING errcode = '42501';
  END IF;

  v_post_fingerprint := public.listing_content_fingerprint_from_post(p_post_id);
  IF v_approval.content_fingerprint IS DISTINCT FROM v_post_fingerprint THEN
    RAISE EXCEPTION 'content_mismatch' USING errcode = '42501';
  END IF;

  PERFORM 1
  FROM public.post_images
  WHERE post_id = p_post_id
  FOR UPDATE;

  SELECT
    count(*),
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', id::text,
          'storagePath', storage_path,
          'url', url,
          'sortOrder', sort_order,
          'isMain', is_main
        )
        ORDER BY sort_order, id
      ),
      '[]'::jsonb
    ),
    max(url) FILTER (WHERE is_main),
    max(sort_order) FILTER (WHERE is_main)
  INTO
    v_image_count,
    v_db_bindings,
    v_expected_main_url,
    v_main_image_index
  FROM public.post_images
  WHERE post_id = p_post_id;

  SELECT
    COALESCE(jsonb_agg(item - 'sha256'), '[]'::jsonb),
    COALESCE(array_agg(item->>'sha256'), '{}')
  INTO v_supplied_identity, v_supplied_hashes
  FROM jsonb_array_elements(COALESCE(p_image_bindings, '[]'::jsonb)) AS item;

  IF v_image_count <> v_approval.image_count
     OR v_db_bindings IS DISTINCT FROM v_supplied_identity
     OR v_approval.image_hashes IS DISTINCT FROM v_supplied_hashes
     OR v_main_image_url IS DISTINCT FROM v_expected_main_url
     OR (
       v_approval.main_image_index >= 0
       AND v_approval.main_image_index IS DISTINCT FROM v_main_image_index
     ) THEN
    RAISE EXCEPTION 'image_content_mismatch' USING errcode = '42501';
  END IF;

  UPDATE public.moderation_approvals
  SET consumed_at = now()
  WHERE token = p_token;

  PERFORM set_config('app.publish_gate', 'on', true);
  UPDATE public.posts
  SET status = p_target::public.post_status, updated_at = now()
  WHERE id = p_post_id AND status = 'draft';
  PERFORM set_config('app.publish_gate', 'off', true);
END;
$$;

REVOKE ALL ON FUNCTION public.publish_approved_post(
  BIGINT, UUID, UUID, TEXT, JSONB
) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.publish_approved_post(
  BIGINT, UUID, UUID, TEXT, JSONB
) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.publish_approved_post(
  BIGINT, UUID, UUID, TEXT, JSONB
) TO service_role;
