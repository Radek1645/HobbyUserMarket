-- =============================================================================
-- 063 — SEC-H01/H02 follow-up: autoritativní finální obsah a fotografie
--
-- SEC-H01:
--   - fingerprint zahrnuje přesný finální title/description i strukturovaná
--     pole a počítá se z uloženého řádku posts,
--   - publish RPC je volatelné jen service_role Server Action,
--   - změna publish-sensitive pole vrací inzerát do draftu.
-- SEC-H02:
--   - approval obsahuje SHA-256 všech moderovaných souborů,
--   - Edge hash počítá z přesných moderovaných bajtů; Server Action před
--     publikací stáhne Storage objekty a předá jejich identity i hashe
--     service-role-only RPC,
--   - post_images UPDATE také vrací post do draftu,
--   - uživatel nesmí přepsat ani smazat Storage objekt, dokud je referencován.
--
-- Nasazení: SQL 063 → sync:moderation → deploy Edge → deploy Next.js.
-- Tokeny vydané před 063 záměrně přestanou fungovat (TTL 30 minut).
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

ALTER TABLE public.moderation_approvals
  ADD COLUMN IF NOT EXISTS image_hashes TEXT[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.moderation_approvals.image_hashes IS
  'SHA-256 všech přesných souborů fotografií v pořadí moderace (SEC-H02).';

-- ---------------------------------------------------------------------------
-- Approval vydává jen Edge Function přes service_role.
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.issue_moderation_approval(UUID, INTEGER, TEXT, TEXT[]);

CREATE FUNCTION public.issue_moderation_approval(
  p_user_id             UUID,
  p_image_count         INTEGER,
  p_content_fingerprint TEXT,
  p_image_hashes        TEXT[] DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token UUID;
BEGIN
  IF cardinality(COALESCE(p_image_hashes, '{}')) <>
     GREATEST(0, LEAST(6, COALESCE(p_image_count, 0))) THEN
    RAISE EXCEPTION 'image_hash_set_invalid' USING errcode = '22023';
  END IF;

  INSERT INTO public.moderation_approvals (
    user_id,
    image_count,
    content_fingerprint,
    image_hashes
  )
  VALUES (
    p_user_id,
    GREATEST(0, LEAST(6, COALESCE(p_image_count, 0))),
    COALESCE(p_content_fingerprint, ''),
    COALESCE(p_image_hashes, '{}')
  )
  RETURNING token INTO v_token;

  RETURN v_token;
END;
$$;

REVOKE ALL ON FUNCTION public.issue_moderation_approval(UUID, INTEGER, TEXT, TEXT[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.issue_moderation_approval(UUID, INTEGER, TEXT, TEXT[]) TO service_role;

-- ---------------------------------------------------------------------------
-- Stejná kanonizace jako Edge content-fingerprint.ts.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.listing_content_fingerprint_from_post(
  p_post_id BIGINT
)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_row RECORD;
  v_price TEXT;
  v_event TEXT;
  v_latitude TEXT;
  v_longitude TEXT;
  v_payload TEXT;
BEGIN
  SELECT
    title,
    description,
    category_type,
    subcategory_slug,
    condition_label,
    price_type,
    price_amount,
    exchange_for,
    location_text,
    location,
    event_date,
    listing_duration_days,
    show_contact_email,
    show_contact_phone,
    contact_phone,
    job_cv_required
  INTO v_row
  FROM public.posts
  WHERE id = p_post_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'post_not_found' USING errcode = 'P0002';
  END IF;

  v_price := CASE
    WHEN v_row.price_amount IS NULL THEN ''
    ELSE v_row.price_amount::text
  END;

  v_event := CASE
    WHEN v_row.event_date IS NULL THEN ''
    ELSE to_char(
      v_row.event_date AT TIME ZONE 'UTC',
      'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
    )
  END;

  v_latitude := CASE
    WHEN v_row.location IS NULL THEN ''
    ELSE to_char(
      extensions.ST_Y(v_row.location::extensions.geometry),
      'FM999990.000000'
    )
  END;

  v_longitude := CASE
    WHEN v_row.location IS NULL THEN ''
    ELSE to_char(
      extensions.ST_X(v_row.location::extensions.geometry),
      'FM999990.000000'
    )
  END;

  v_payload :=
    '{"title":' || to_json(btrim(COALESCE(v_row.title, ''))) ||
    ',"description":' || to_json(btrim(COALESCE(v_row.description, ''))) ||
    ',"categoryType":' || to_json(btrim(COALESCE(v_row.category_type::text, ''))) ||
    ',"subcategorySlug":' || to_json(btrim(COALESCE(v_row.subcategory_slug, ''))) ||
    ',"conditionLabel":' || to_json(btrim(COALESCE(v_row.condition_label, ''))) ||
    ',"priceType":' || to_json(btrim(COALESCE(v_row.price_type, ''))) ||
    ',"priceAmount":' || to_json(v_price) ||
    ',"exchangeFor":' || to_json(
      CASE
        WHEN v_row.price_type = 'exchange'
          THEN btrim(COALESCE(v_row.exchange_for, ''))
        ELSE ''
      END
    ) ||
    ',"locationText":' || to_json(btrim(COALESCE(v_row.location_text, ''))) ||
    ',"latitude":' || to_json(v_latitude) ||
    ',"longitude":' || to_json(v_longitude) ||
    ',"eventDate":' || to_json(v_event) ||
    ',"listingDurationDays":' || to_json(COALESCE(v_row.listing_duration_days, 0)) ||
    ',"showContactEmail":' || to_json(COALESCE(v_row.show_contact_email, false)) ||
    ',"showContactPhone":' || to_json(COALESCE(v_row.show_contact_phone, false)) ||
    ',"contactPhone":' || to_json(
      CASE
        WHEN COALESCE(v_row.show_contact_phone, false)
          THEN regexp_replace(btrim(COALESCE(v_row.contact_phone, '')), '\s+', ' ', 'g')
        ELSE ''
      END
    ) ||
    ',"jobCvRequired":' || to_json(COALESCE(v_row.job_cv_required, false)) ||
    '}';

  RETURN encode(digest(v_payload, 'sha256'), 'hex');
END;
$$;

REVOKE ALL ON FUNCTION public.listing_content_fingerprint_from_post(BIGINT) FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- Publikace jen ze serverové service-role cesty.
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.publish_approved_post(BIGINT, UUID, TEXT, TEXT, TEXT[]);
DROP FUNCTION IF EXISTS public.publish_approved_post(BIGINT, UUID, UUID, TEXT, TEXT[]);
DROP FUNCTION IF EXISTS public.publish_approved_post(BIGINT, UUID, UUID, TEXT, JSONB);

CREATE FUNCTION public.publish_approved_post(
  p_post_id       BIGINT,
  p_token         UUID,
  p_user_id       UUID,
  p_target        TEXT DEFAULT 'active',
  p_image_bindings JSONB DEFAULT '[]'::jsonb
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_approval         RECORD;
  v_post_owner       UUID;
  v_post_status      public.post_status;
  v_main_image_url   TEXT;
  v_image_count      INTEGER;
  v_post_fingerprint TEXT;
  v_db_bindings      JSONB;
  v_supplied_identity JSONB;
  v_supplied_hashes  TEXT[];
  v_expected_main_url TEXT;
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
    max(url) FILTER (WHERE is_main)
  INTO v_image_count, v_db_bindings, v_expected_main_url
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
     OR v_main_image_url IS DISTINCT FROM v_expected_main_url THEN
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

REVOKE ALL ON FUNCTION public.publish_approved_post(BIGINT, UUID, UUID, TEXT, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.publish_approved_post(BIGINT, UUID, UUID, TEXT, JSONB) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.publish_approved_post(BIGINT, UUID, UUID, TEXT, JSONB) TO service_role;

-- ---------------------------------------------------------------------------
-- Jakákoli změna publish-sensitive obsahu vrací inzerát do draftu.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_post_publish_gate()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_gate BOOLEAN := COALESCE(current_setting('app.publish_gate', true) = 'on', false);
  v_privileged BOOLEAN :=
    COALESCE(auth.role(), '') NOT IN ('anon', 'authenticated')
    OR public.is_moderator_or_admin();
BEGIN
  IF v_gate OR v_privileged THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE'
     AND NEW.status = 'deleted'
     AND OLD.status IS DISTINCT FROM 'deleted' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE'
     AND NEW.status <> 'deleted'
     AND (
       NEW.title IS DISTINCT FROM OLD.title
       OR NEW.description IS DISTINCT FROM OLD.description
       OR NEW.category_type IS DISTINCT FROM OLD.category_type
       OR NEW.subcategory_slug IS DISTINCT FROM OLD.subcategory_slug
       OR NEW.condition_label IS DISTINCT FROM OLD.condition_label
       OR NEW.price_type IS DISTINCT FROM OLD.price_type
       OR NEW.price_amount IS DISTINCT FROM OLD.price_amount
       OR NEW.exchange_for IS DISTINCT FROM OLD.exchange_for
       OR NEW.location_text IS DISTINCT FROM OLD.location_text
       OR NEW.location IS DISTINCT FROM OLD.location
       OR NEW.event_date IS DISTINCT FROM OLD.event_date
       OR NEW.listing_duration_days IS DISTINCT FROM OLD.listing_duration_days
       OR NEW.show_contact_email IS DISTINCT FROM OLD.show_contact_email
       OR NEW.show_contact_phone IS DISTINCT FROM OLD.show_contact_phone
       OR NEW.contact_phone IS DISTINCT FROM OLD.contact_phone
       OR NEW.job_cv_required IS DISTINCT FROM OLD.job_cv_required
     ) THEN
    NEW.status := 'draft';
    NEW.status_reason_code := NULL;
    RETURN NEW;
  END IF;

  IF NEW.status IN ('active', 'hidden', 'archived')
     AND (
       TG_OP = 'INSERT'
       OR OLD.status NOT IN ('active', 'hidden', 'archived')
     ) THEN
    RAISE EXCEPTION 'Publishing requires moderation approval'
      USING errcode = '42501';
  END IF;

  RETURN NEW;
END;
$$;

-- Vlastník smí měnit pořadí/hlavní příznak, ne identitu řádku fotografie.
CREATE OR REPLACE FUNCTION public.protect_post_image_identity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF COALESCE(auth.role(), '') = 'authenticated'
     AND NOT public.is_moderator_or_admin()
     AND (
       NEW.post_id IS DISTINCT FROM OLD.post_id
       OR NEW.storage_path IS DISTINCT FROM OLD.storage_path
       OR NEW.url IS DISTINCT FROM OLD.url
     ) THEN
    RAISE EXCEPTION 'post_image_identity_immutable'
      USING errcode = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_post_images_protect_identity ON public.post_images;
CREATE TRIGGER trg_post_images_protect_identity
  BEFORE UPDATE ON public.post_images
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_post_image_identity();

-- Změna řádku fotografie (včetně storage_path/url) vždy vrátí viditelný
-- inzerát do draftu. Service-role publish gate ji neobchází.
DROP TRIGGER IF EXISTS trg_post_images_revert ON public.post_images;
CREATE TRIGGER trg_post_images_revert
  AFTER INSERT OR UPDATE OR DELETE ON public.post_images
  FOR EACH ROW
  EXECUTE FUNCTION public.revert_post_on_image_change();

-- Uživatel nesmí přepsat existující objekt (app používá UUID + upsert:false).
DROP POLICY IF EXISTS post_images_storage_update ON storage.objects;

-- Referencovaný objekt se nejdřív odpojí z post_images, teprve potom smaže.
DROP POLICY IF EXISTS post_images_storage_delete ON storage.objects;
CREATE POLICY post_images_storage_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'post-images'
    AND (
      public.is_moderator_or_admin()
      OR (
        auth.uid()::text = (storage.foldername(name))[1]
        AND NOT EXISTS (
          SELECT 1
          FROM public.post_images pi
          WHERE pi.storage_path = name
        )
      )
    )
  );
