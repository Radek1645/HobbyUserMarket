-- =============================================================================
-- 062 — Bezpečnostní audit 2026-07-27, nálezy SEC-H01 až SEC-H03
--
-- SEC-H01: approval token teď nese `content_fingerprint` (SHA-256 kategorie,
--   podkategorie, stavu, typu/výše ceny, lokality a data akce — stejný hash
--   dopočítá Server Action při publikaci; viz `src/lib/moderation/
--   content-fingerprint.ts` a Deno protějšek). Změna některého z těchto polí
--   po AI kontrole starý token zneplatní.
-- SEC-H02: approval token nese i `new_image_hashes` (SHA-256 nově nahraných
--   fotek). `publish_approved_post` teď kontroluje, že každá nově nahraná
--   fotka byla součástí schváleného souboru — nejde tedy fotku po schválení
--   vyměnit za jinou při zachování počtu.
-- SEC-H03: `rate_limits` byla čitelná/zapisovatelná i z klienta
--   (`authenticated`), navíc bez atomické inkrementace (race select→update).
--   Grant i policy pro anon/authenticated se odebírají; inkrementace jde jen
--   přes nový `increment_rate_limit` (SECURITY DEFINER, INSERT … ON CONFLICT).
--
-- Spustit PO 027_moderation_publish_gate.sql. Bezpečně opakovatelné.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. SEC-H01/H02 — nová pole approval tokenu
-- -----------------------------------------------------------------------------
ALTER TABLE public.moderation_approvals
  ADD COLUMN IF NOT EXISTS content_fingerprint TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS new_image_hashes TEXT[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.moderation_approvals.content_fingerprint IS
  'SHA-256 kategorie/podkategorie/stavu/ceny/lokality/data akce v okamžiku AI schválení (SEC-H01).';
COMMENT ON COLUMN public.moderation_approvals.new_image_hashes IS
  'SHA-256 otisky nově nahraných fotek poslaných AI kontrole (SEC-H02).';

-- -----------------------------------------------------------------------------
-- 2. SEC-H01/H02 — vydání tokenu nese fingerprint a hashe fotek
-- -----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.issue_moderation_approval(UUID, INTEGER);

CREATE FUNCTION public.issue_moderation_approval(
  p_user_id             UUID,
  p_image_count         INTEGER,
  p_content_fingerprint TEXT,
  p_new_image_hashes    TEXT[] DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token UUID;
BEGIN
  INSERT INTO public.moderation_approvals (
    user_id, image_count, content_fingerprint, new_image_hashes
  )
  VALUES (
    p_user_id,
    GREATEST(0, LEAST(6, COALESCE(p_image_count, 0))),
    COALESCE(p_content_fingerprint, ''),
    COALESCE(p_new_image_hashes, '{}')
  )
  RETURNING token INTO v_token;
  RETURN v_token;
END;
$$;

REVOKE ALL ON FUNCTION public.issue_moderation_approval(UUID, INTEGER, TEXT, TEXT[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.issue_moderation_approval(UUID, INTEGER, TEXT, TEXT[]) TO service_role;

-- -----------------------------------------------------------------------------
-- 3. SEC-H01/H02 — publikace ověří fingerprint a otisky nových fotek
-- -----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.publish_approved_post(BIGINT, UUID, TEXT);

CREATE FUNCTION public.publish_approved_post(
  p_post_id              BIGINT,
  p_token                UUID,
  p_target               TEXT DEFAULT 'active',
  p_content_fingerprint  TEXT DEFAULT '',
  p_new_image_hashes     TEXT[] DEFAULT '{}'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid         UUID := auth.uid();
  v_approval    RECORD;
  v_post_owner  UUID;
  v_image_count INTEGER;
  v_remaining   TEXT[];
  v_hash        TEXT;
  v_idx         INTEGER;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING errcode = '28000';
  END IF;

  IF p_target NOT IN ('active', 'hidden') THEN
    RAISE EXCEPTION 'invalid_publish_target' USING errcode = '22023';
  END IF;

  SELECT user_id INTO v_post_owner FROM public.posts WHERE id = p_post_id;
  IF NOT FOUND OR v_post_owner <> v_uid THEN
    RAISE EXCEPTION 'post_not_owned' USING errcode = '42501';
  END IF;

  SELECT * INTO v_approval
  FROM public.moderation_approvals
  WHERE token = p_token
  FOR UPDATE;

  IF NOT FOUND
     OR v_approval.user_id <> v_uid
     OR v_approval.consumed_at IS NOT NULL
     OR v_approval.expires_at < now() THEN
    RAISE EXCEPTION 'invalid_or_expired_approval' USING errcode = '42501';
  END IF;

  -- SEC-H01: kategorie/cena/lokalita/datum akce se nesměly od AI kontroly změnit.
  IF v_approval.content_fingerprint IS DISTINCT FROM COALESCE(p_content_fingerprint, '') THEN
    RAISE EXCEPTION 'content_mismatch' USING errcode = '42501';
  END IF;

  -- Image binding: nelze publikovat víc fotek, než prošlo bezpečnostním filtrem.
  SELECT count(*) INTO v_image_count
  FROM public.post_images
  WHERE post_id = p_post_id;

  IF v_image_count > v_approval.image_count THEN
    RAISE EXCEPTION 'image_set_mismatch' USING errcode = '42501';
  END IF;

  -- SEC-H02: každá nově nahraná fotka musí být mezi hashi schválenými AI
  -- kontrolou (multiset match — po výměně/přidání neschválené fotky selže).
  v_remaining := COALESCE(v_approval.new_image_hashes, '{}');
  FOREACH v_hash IN ARRAY COALESCE(p_new_image_hashes, '{}') LOOP
    v_idx := array_position(v_remaining, v_hash);
    IF v_idx IS NULL THEN
      RAISE EXCEPTION 'image_content_mismatch' USING errcode = '42501';
    END IF;
    v_remaining := v_remaining[1:v_idx - 1] || v_remaining[v_idx + 1:array_length(v_remaining, 1)];
  END LOOP;

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

REVOKE ALL ON FUNCTION public.publish_approved_post(BIGINT, UUID, TEXT, TEXT, TEXT[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.publish_approved_post(BIGINT, UUID, TEXT, TEXT, TEXT[]) TO authenticated;

-- -----------------------------------------------------------------------------
-- 4. SEC-H03 — rate_limits jen přes service_role + atomický RPC
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS rate_limits_select_own ON public.rate_limits;
DROP POLICY IF EXISTS rate_limits_insert_own ON public.rate_limits;
DROP POLICY IF EXISTS rate_limits_update_own ON public.rate_limits;

REVOKE ALL ON public.rate_limits FROM authenticated, anon;

-- Atomický upsert (INSERT … ON CONFLICT DO UPDATE) — nahrazuje dřívější
-- SELECT + UPDATE z Edge Function, které umožňovalo race mezi paralelními
-- požadavky (obejití limitu 20/h paralelizací).
CREATE OR REPLACE FUNCTION public.increment_rate_limit(
  p_user_id      UUID,
  p_action_type  TEXT,
  p_window_start TIMESTAMPTZ
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  INSERT INTO public.rate_limits (user_id, action_type, window_start, count)
  VALUES (p_user_id, p_action_type::public.rate_limit_action, p_window_start, 1)
  ON CONFLICT (user_id, action_type, window_start)
  DO UPDATE SET count = public.rate_limits.count + 1
  RETURNING count INTO v_count;

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_rate_limit(UUID, TEXT, TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_rate_limit(UUID, TEXT, TIMESTAMPTZ) TO service_role;
