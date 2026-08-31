-- =============================================================================
-- 081 — Právní retence (B1–B3): hidden_at, kredity archived, image_sha256
--
-- Konstanty sync s src/config/gdpr-retention.ts:
--   LISTING_PII_PURGE_DAYS = 30
--   RATE_LIMIT_PURGE_DAYS  = 30
--   BLOCKED_STALE_DAYS     = 90  (varování 7 dní předem = 83)
--   RETENTION_MONTHS       = 12
--
-- Nové sloupce na posts NEJSOU v GRANT SELECT (anon/authenticated) — fail-closed.
-- Cron route existuje, ale do vercel.json patří až 2. deploy po SELECT count(*).
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Schema
-- -----------------------------------------------------------------------------
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS hidden_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS blocked_stale_warned_at TIMESTAMPTZ;

COMMENT ON COLUMN public.posts.hidden_at IS
  'Razítko přechodu do archived/deleted. Úklid PII po 30 dnech, DELETE řádku po 12 měsících.';
COMMENT ON COLUMN public.posts.blocked_stale_warned_at IS
  'Odesláno varování 7 dní před překlopením blocked → deleted.';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS listing_credits_consumed_archived INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gdpr_version TEXT,
  ADD COLUMN IF NOT EXISTS pricing_version TEXT;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_listing_credits_consumed_archived_nonneg;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_listing_credits_consumed_archived_nonneg
  CHECK (listing_credits_consumed_archived >= 0);

COMMENT ON COLUMN public.profiles.listing_credits_consumed_archived IS
  'Spotřebované kredity ze smazaných řádků posts. Přičítá se v user_listing_lifetime_count.';
COMMENT ON COLUMN public.profiles.gdpr_version IS
  'Verze zásad ochrany osobních údajů v okamžiku souhlasu.';
COMMENT ON COLUMN public.profiles.pricing_version IS
  'Verze ceníku / limitů inzerce v okamžiku souhlasu.';

ALTER TABLE public.moderation_hard_reject_evidence
  ADD COLUMN IF NOT EXISTS image_sha256 TEXT;

COMMENT ON COLUMN public.moderation_hard_reject_evidence.image_sha256 IS
  'SHA-256 bajtů nahrané evidenční fotky (stejné Uint8Array jako upload).';

GRANT UPDATE, DELETE ON public.moderation_hard_reject_evidence TO service_role;
GRANT DELETE ON public.posts TO service_role;

CREATE INDEX IF NOT EXISTS posts_hidden_at_idx
  ON public.posts (hidden_at)
  WHERE hidden_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS posts_blocked_stale_idx
  ON public.posts (updated_at)
  WHERE status = 'blocked';

-- Backfill: už skryté řádky. První běh cronu je může uklidit naráz — cron
-- proto není v vercel.json, dokud SELECT count(*) na produkci neprojde okem.
UPDATE public.posts
SET hidden_at = COALESCE(updated_at, created_at, now())
WHERE status IN ('archived', 'deleted')
  AND hidden_at IS NULL;

-- -----------------------------------------------------------------------------
-- 2. Write guard — razítko hidden_at + zákaz podvržení sloupce
--    Razítko PŘED privileged return, ať service_role / staff taky vyplní.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_post_privileged_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_privileged BOOLEAN :=
    COALESCE(auth.role(), '') NOT IN ('anon', 'authenticated')
    OR public.is_moderator_or_admin();
  v_duration_recalc BOOLEAN;
  v_hard_cap TIMESTAMPTZ;
  v_hidden_stamped BOOLEAN := false;
BEGIN
  IF TG_OP = 'UPDATE'
     AND OLD.hidden_at IS NULL
     AND NEW.status IN ('archived', 'deleted')
     AND OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.hidden_at := now();
    v_hidden_stamped := true;
  END IF;

  v_hard_cap := public.listing_lifetime_hard_cap(COALESCE(NEW.created_at, now()));

  IF NEW.expires_at IS NOT NULL AND NEW.expires_at > v_hard_cap THEN
    RAISE EXCEPTION 'expires_at exceeds listing max lifetime'
      USING errcode = '23514';
  END IF;

  IF v_privileged THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF COALESCE(NEW.payment_status, 'free') <> 'free' THEN
      RAISE EXCEPTION 'payment_status is not user-editable'
        USING errcode = '42501';
    END IF;
    IF COALESCE(NEW.renew_count, 0) <> 0 THEN
      RAISE EXCEPTION 'renew_count is not user-editable'
        USING errcode = '42501';
    END IF;
    IF NEW.expiry_warning_for_expires_at IS NOT NULL THEN
      RAISE EXCEPTION 'expiry_warning_for_expires_at is not user-editable'
        USING errcode = '42501';
    END IF;
    IF NEW.hidden_at IS NOT NULL THEN
      RAISE EXCEPTION 'hidden_at is not user-editable'
        USING errcode = '42501';
    END IF;
    IF NEW.blocked_stale_warned_at IS NOT NULL THEN
      RAISE EXCEPTION 'blocked_stale_warned_at is not user-editable'
        USING errcode = '42501';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.hidden_at IS DISTINCT FROM OLD.hidden_at AND NOT v_hidden_stamped THEN
    RAISE EXCEPTION 'hidden_at is not user-editable'
      USING errcode = '42501';
  END IF;

  IF NEW.blocked_stale_warned_at IS DISTINCT FROM OLD.blocked_stale_warned_at THEN
    RAISE EXCEPTION 'blocked_stale_warned_at is not user-editable'
      USING errcode = '42501';
  END IF;

  IF NEW.expiry_warning_for_expires_at IS DISTINCT FROM OLD.expiry_warning_for_expires_at THEN
    RAISE EXCEPTION 'expiry_warning_for_expires_at is not user-editable'
      USING errcode = '42501';
  END IF;

  IF NEW.payment_status IS DISTINCT FROM OLD.payment_status THEN
    RAISE EXCEPTION 'payment_status is not user-editable'
      USING errcode = '42501';
  END IF;

  IF NEW.renew_count IS DISTINCT FROM OLD.renew_count THEN
    IF NEW.renew_count <> OLD.renew_count + 1 THEN
      RAISE EXCEPTION 'renew_count can only be incremented by 1'
        USING errcode = '42501';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.expires_at IS DISTINCT FROM OLD.expires_at THEN
    v_duration_recalc :=
      NEW.listing_duration_days IS DISTINCT FROM OLD.listing_duration_days
      OR NEW.event_date IS DISTINCT FROM OLD.event_date
      OR NEW.category_type IS DISTINCT FROM OLD.category_type;

    IF NOT v_duration_recalc THEN
      RAISE EXCEPTION 'expires_at is not directly user-editable'
        USING errcode = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Kredity: jen service_role (ne admin přes REST). Jinak PATCH …_archived: 0
-- obchází past č. 1 u DELETE z posts.
CREATE OR REPLACE FUNCTION public.prevent_ico_verified_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_privileged BOOLEAN :=
    COALESCE(auth.role(), '') NOT IN ('anon', 'authenticated')
    OR public.is_admin();
  v_service BOOLEAN :=
    COALESCE(auth.role(), '') NOT IN ('anon', 'authenticated');
BEGIN
  IF TG_OP = 'INSERT'
     AND COALESCE(NEW.listing_credits_consumed_archived, 0) <> 0
     AND NOT v_service THEN
    RAISE EXCEPTION 'listing_credits_consumed_archived is not user-editable'
      USING errcode = '42501';
  END IF;

  IF TG_OP = 'UPDATE'
     AND NEW.listing_credits_consumed_archived
         IS DISTINCT FROM OLD.listing_credits_consumed_archived
     AND NOT v_service THEN
    RAISE EXCEPTION 'listing_credits_consumed_archived is not user-editable'
      USING errcode = '42501';
  END IF;

  IF TG_OP = 'UPDATE'
     AND NEW.company_ico_verified IS TRUE
     AND OLD.company_ico_verified IS DISTINCT FROM TRUE
     AND NOT v_privileged THEN
    RAISE EXCEPTION 'company_ico_verified can only be set by admin'
      USING errcode = '42501';
  END IF;

  IF TG_OP = 'INSERT'
     AND NEW.company_ico_verified IS TRUE
     AND NOT v_privileged THEN
    RAISE EXCEPTION 'company_ico_verified can only be set by admin'
      USING errcode = '42501';
  END IF;

  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- 3. Lifetime count = živé spotřebované řádky + archivované kredity
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.user_listing_lifetime_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (
      SELECT count(*)::INTEGER
      FROM public.posts p
      WHERE p.user_id = p_user_id
        AND p.listing_quota_consumed = true
    )
    + COALESCE(
        (
          SELECT pr.listing_credits_consumed_archived
          FROM public.profiles pr
          WHERE pr.id = p_user_id
        ),
        0
      );
$$;

-- -----------------------------------------------------------------------------
-- 4. PII úklid — kandidáti (cron smaže storage, pak apply)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.purge_hidden_listing_pii(p_limit INTEGER DEFAULT 100)
RETURNS TABLE (post_id BIGINT, storage_path TEXT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH candidates AS (
    SELECT p.id
    FROM public.posts p
    WHERE p.status IN ('archived', 'deleted')
      AND p.hidden_at IS NOT NULL
      AND p.hidden_at < now() - INTERVAL '30 days'
      AND (
        p.contact_phone IS NOT NULL
        OR p.location IS NOT NULL
        OR p.original_title IS NOT NULL
        OR p.original_description IS NOT NULL
        OR p.main_image_url IS NOT NULL
        OR EXISTS (
          SELECT 1 FROM public.post_images i WHERE i.post_id = p.id
        )
      )
    ORDER BY p.hidden_at ASC
    LIMIT LEAST(GREATEST(COALESCE(p_limit, 1), 1), 500)
  )
  SELECT c.id AS post_id, pi.storage_path
  FROM candidates c
  LEFT JOIN public.post_images pi ON pi.post_id = c.id;
$$;

REVOKE ALL ON FUNCTION public.purge_hidden_listing_pii(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purge_hidden_listing_pii(INTEGER) TO service_role;

CREATE OR REPLACE FUNCTION public.apply_hidden_listing_pii_purge(p_post_ids BIGINT[])
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated INTEGER := 0;
BEGIN
  IF p_post_ids IS NULL OR array_length(p_post_ids, 1) IS NULL THEN
    RETURN 0;
  END IF;

  UPDATE public.posts
  SET
    contact_phone = NULL,
    location = NULL,
    original_title = NULL,
    original_description = NULL,
    main_image_url = NULL
  WHERE id = ANY (p_post_ids)
    AND status IN ('archived', 'deleted');

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  DELETE FROM public.post_images
  WHERE post_id = ANY (p_post_ids);

  RETURN v_updated;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_hidden_listing_pii_purge(BIGINT[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_hidden_listing_pii_purge(BIGINT[]) TO service_role;

-- -----------------------------------------------------------------------------
-- 5. DELETE řádků po 12 měsících + inkrement kreditů (past č. 1)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.purge_hidden_listing_rows(p_limit INTEGER DEFAULT 100)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INTEGER := 0;
  v_credited INTEGER := 0;
BEGIN
  WITH locked AS (
    SELECT p.id, p.user_id, p.listing_quota_consumed
    FROM public.posts p
    WHERE p.status IN ('archived', 'deleted')
      AND p.hidden_at IS NOT NULL
      AND p.hidden_at < now() - INTERVAL '12 months'
    ORDER BY p.hidden_at ASC
    LIMIT LEAST(GREATEST(COALESCE(p_limit, 1), 1), 500)
    FOR UPDATE OF p SKIP LOCKED
  ),
  credited AS (
    UPDATE public.profiles pr
    SET listing_credits_consumed_archived =
          pr.listing_credits_consumed_archived + c.consumed_count
    FROM (
      SELECT user_id, count(*)::INTEGER AS consumed_count
      FROM locked
      WHERE user_id IS NOT NULL
        AND listing_quota_consumed
      GROUP BY user_id
    ) c
    WHERE pr.id = c.user_id
    RETURNING pr.id
  ),
  removed AS (
    DELETE FROM public.posts p
    USING locked
    WHERE p.id = locked.id
    RETURNING p.id
  )
  SELECT
    (SELECT count(*)::INTEGER FROM removed),
    (SELECT count(*)::INTEGER FROM credited)
  INTO v_deleted, v_credited;

  RETURN COALESCE(v_deleted, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.purge_hidden_listing_rows(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purge_hidden_listing_rows(INTEGER) TO service_role;

-- -----------------------------------------------------------------------------
-- 6. Smazání účtu: kredity schovat dřív, než auth.users SET NULL na user_id
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prepare_user_account_deletion(
  p_user_id     UUID,
  p_actor_id    UUID,
  p_source      TEXT,
  p_reason_code TEXT DEFAULT NULL,
  p_reason_note TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_no BIGINT;
BEGIN
  IF p_source NOT IN ('self', 'admin') THEN
    RAISE EXCEPTION 'invalid source: %', p_source;
  END IF;

  SELECT profile_no INTO v_profile_no
  FROM public.profiles
  WHERE id = p_user_id;

  IF v_profile_no IS NULL THEN
    RAISE EXCEPTION 'profile not found: %', p_user_id;
  END IF;

  UPDATE public.comments
  SET author_nickname = '[smazaný účet]'
  WHERE user_id = p_user_id;

  UPDATE public.profiles pr
  SET listing_credits_consumed_archived =
        pr.listing_credits_consumed_archived + (
          SELECT count(*)::INTEGER
          FROM public.posts p
          WHERE p.user_id = p_user_id
            AND p.listing_quota_consumed
        )
  WHERE pr.id = p_user_id;

  UPDATE public.posts
  SET status = 'deleted', updated_at = now()
  WHERE user_id = p_user_id
    AND status <> 'deleted';

  UPDATE public.profiles
  SET
    nickname = 'deleted_' || v_profile_no::TEXT,
    email = 'deleted_' || v_profile_no::TEXT || '@deleted.local',
    name = NULL,
    surname = NULL,
    phone = NULL,
    avatar_url = NULL,
    is_company = false,
    company_name = NULL,
    company_ico = NULL,
    company_ico_verified = false,
    age_confirmed_at = NULL,
    vop_accepted_at = NULL,
    vop_version = NULL,
    marketing_consent_at = NULL,
    gdpr_version = NULL,
    pricing_version = NULL,
    updated_at = now()
  WHERE id = p_user_id;

  INSERT INTO public.account_deletion_events (
    target_profile_no,
    target_user_id,
    actor_id,
    source,
    reason_code,
    reason_note
  ) VALUES (
    v_profile_no,
    p_user_id,
    p_actor_id,
    p_source,
    p_reason_code,
    p_reason_note
  );
END;
$$;

-- -----------------------------------------------------------------------------
-- 7. Retence provozních tabulek (B2)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.purge_retention_tables()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account_deletion INTEGER := 0;
  v_gdpr_warnings INTEGER := 0;
  v_contact_reveals INTEGER := 0;
  v_moderation_checks INTEGER := 0;
  v_audit_events INTEGER := 0;
  v_reports INTEGER := 0;
  v_moderator_notes INTEGER := 0;
  v_anon_limits INTEGER := 0;
  v_rate_limits INTEGER := 0;
BEGIN
  DELETE FROM public.account_deletion_events
  WHERE created_at < now() - INTERVAL '12 months';
  GET DIAGNOSTICS v_account_deletion = ROW_COUNT;

  DELETE FROM public.gdpr_retention_warnings
  WHERE warned_at < now() - INTERVAL '12 months';
  GET DIAGNOSTICS v_gdpr_warnings = ROW_COUNT;

  DELETE FROM public.contact_reveals
  WHERE revealed_at < now() - INTERVAL '12 months';
  GET DIAGNOSTICS v_contact_reveals = ROW_COUNT;

  DELETE FROM public.moderation_checks
  WHERE created_at < now() - INTERVAL '12 months';
  GET DIAGNOSTICS v_moderation_checks = ROW_COUNT;

  DELETE FROM public.audit_events
  WHERE created_at < now() - INTERVAL '12 months';
  GET DIAGNOSTICS v_audit_events = ROW_COUNT;

  DELETE FROM public.reports
  WHERE created_at < now() - INTERVAL '12 months';
  GET DIAGNOSTICS v_reports = ROW_COUNT;

  DELETE FROM public.moderator_notes
  WHERE created_at < now() - INTERVAL '12 months';
  GET DIAGNOSTICS v_moderator_notes = ROW_COUNT;

  DELETE FROM public.anonymous_rate_limits
  WHERE window_start < now() - INTERVAL '30 days';
  GET DIAGNOSTICS v_anon_limits = ROW_COUNT;

  DELETE FROM public.rate_limits
  WHERE window_start < now() - INTERVAL '30 days';
  GET DIAGNOSTICS v_rate_limits = ROW_COUNT;

  RETURN jsonb_build_object(
    'account_deletion_events', v_account_deletion,
    'gdpr_retention_warnings', v_gdpr_warnings,
    'contact_reveals', v_contact_reveals,
    'moderation_checks', v_moderation_checks,
    'audit_events', v_audit_events,
    'reports', v_reports,
    'moderator_notes', v_moderator_notes,
    'anonymous_rate_limits', v_anon_limits,
    'rate_limits', v_rate_limits
  );
END;
$$;

REVOKE ALL ON FUNCTION public.purge_retention_tables() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purge_retention_tables() TO service_role;

-- -----------------------------------------------------------------------------
-- 8. Stale blocked — varování 83 dní, flip 90 dní
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.list_blocked_stale_warning_candidates(
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  post_id BIGINT,
  user_id UUID,
  title TEXT,
  slug TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.user_id, p.title, p.slug
  FROM public.posts p
  WHERE p.status = 'blocked'
    AND p.user_id IS NOT NULL
    AND p.blocked_stale_warned_at IS NULL
    AND p.updated_at < now() - INTERVAL '83 days'
    AND p.updated_at >= now() - INTERVAL '90 days'
  ORDER BY p.updated_at ASC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 1), 1), 500);
$$;

REVOKE ALL ON FUNCTION public.list_blocked_stale_warning_candidates(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_blocked_stale_warning_candidates(INTEGER) TO service_role;

CREATE OR REPLACE FUNCTION public.mark_blocked_stale_warning_sent(p_post_id BIGINT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.posts
  SET blocked_stale_warned_at = now()
  WHERE id = p_post_id
    AND status = 'blocked'
    AND blocked_stale_warned_at IS NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_blocked_stale_warning_sent(BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_blocked_stale_warning_sent(BIGINT) TO service_role;

CREATE OR REPLACE FUNCTION public.flip_blocked_stale_listings(p_limit INTEGER DEFAULT 100)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_flipped INTEGER := 0;
BEGIN
  WITH locked AS (
    SELECT p.id
    FROM public.posts p
    WHERE p.status = 'blocked'
      AND p.updated_at < now() - INTERVAL '90 days'
    ORDER BY p.updated_at ASC
    LIMIT LEAST(GREATEST(COALESCE(p_limit, 1), 1), 500)
    FOR UPDATE OF p SKIP LOCKED
  ),
  flipped AS (
    UPDATE public.posts p
    SET
      status = 'deleted',
      updated_at = now()
    FROM locked
    WHERE p.id = locked.id
    RETURNING p.id
  )
  SELECT count(*)::INTEGER INTO v_flipped FROM flipped;

  RETURN COALESCE(v_flipped, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.flip_blocked_stale_listings(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.flip_blocked_stale_listings(INTEGER) TO service_role;

-- -----------------------------------------------------------------------------
-- 9. FK: DELETE posts musí CASCADE (jinak 12měs. úklid spadne)
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_missing TEXT;
  v_non_cascade TEXT;
BEGIN
  SELECT string_agg(expected.relname, ', ' ORDER BY expected.relname)
  INTO v_missing
  FROM unnest(ARRAY[
    'post_images',
    'comments',
    'reports',
    'contact_reveals',
    'inquiry_events',
    'listing_views'
  ]) AS expected(relname)
  WHERE NOT EXISTS (
    SELECT 1
    FROM pg_constraint con
    WHERE con.confrelid = 'public.posts'::regclass
      AND con.contype = 'f'
      AND con.confdeltype = 'c'
      AND con.conrelid = ('public.' || expected.relname)::regclass
  );

  IF v_missing IS NOT NULL THEN
    RAISE EXCEPTION '081: chybí ON DELETE CASCADE z: %', v_missing;
  END IF;

  SELECT string_agg(
    con.conrelid::regclass::text || '.' || con.conname || ' del=' || con.confdeltype::text,
    ', '
  )
  INTO v_non_cascade
  FROM pg_constraint con
  WHERE con.confrelid = 'public.posts'::regclass
    AND con.contype = 'f'
    AND con.confdeltype <> 'c';

  IF v_non_cascade IS NOT NULL THEN
    RAISE EXCEPTION '081: FK na posts bez CASCADE: %', v_non_cascade;
  END IF;
END;
$$;

-- -----------------------------------------------------------------------------
-- 10. Ověření GRANT + write guard. Úspěšný SELECT/UPDATE = ROLLBACK.
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  PERFORM set_config('role', 'authenticated', true);

  BEGIN
    EXECUTE 'SELECT hidden_at FROM public.posts LIMIT 1';
    RAISE EXCEPTION '081: authenticated stále čte hidden_at';
  EXCEPTION
    WHEN insufficient_privilege THEN NULL;
  END;

  BEGIN
    EXECUTE 'SELECT blocked_stale_warned_at FROM public.posts LIMIT 1';
    RAISE EXCEPTION '081: authenticated stále čte blocked_stale_warned_at';
  EXCEPTION
    WHEN insufficient_privilege THEN NULL;
  END;

  PERFORM set_config('role', 'none', true);
END;
$$;

ALTER TABLE public.posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Write guard: GRANT SELECT nestačí. JWT role musí být authenticated,
-- jinak auth.role() je NULL a trigger považuje relaci za privileged.
DO $$
DECLARE
  v_post_id BIGINT;
  v_profile_id UUID;
BEGIN
  SELECT id INTO v_post_id
  FROM public.posts
  WHERE status = 'deleted'
  LIMIT 1;

  IF v_post_id IS NULL THEN
    SELECT id INTO v_post_id FROM public.posts LIMIT 1;
  END IF;

  SELECT id INTO v_profile_id FROM public.profiles LIMIT 1;

  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', '{"role":"authenticated"}', true);

  IF v_post_id IS NOT NULL THEN
    BEGIN
      UPDATE public.posts
      SET hidden_at = now()
      WHERE id = v_post_id;

      IF FOUND THEN
        RAISE EXCEPTION '081: authenticated zapsal hidden_at';
      END IF;
    EXCEPTION
      WHEN insufficient_privilege THEN NULL;
    END;
  END IF;

  IF v_profile_id IS NOT NULL THEN
    BEGIN
      UPDATE public.profiles
      SET listing_credits_consumed_archived = listing_credits_consumed_archived + 1
      WHERE id = v_profile_id;

      IF FOUND THEN
        RAISE EXCEPTION '081: authenticated zapsal listing_credits_consumed_archived';
      END IF;
    EXCEPTION
      WHEN insufficient_privilege THEN NULL;
    END;
  END IF;

  PERFORM set_config('role', 'none', true);
  PERFORM set_config('request.jwt.claim.role', '', true);
  PERFORM set_config('request.jwt.claims', '', true);
END;
$$;

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

COMMIT;
