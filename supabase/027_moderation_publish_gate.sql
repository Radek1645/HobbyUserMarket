-- =============================================================================
-- 027 — Server-side vynucení AI moderace (audit H1 + P14)
-- Publikace (status='active') je dosažitelná JEN přes publish_approved_post,
-- který spotřebuje approval token vydaný Edge Function po bezpečnostním filtru.
-- Přímý insert/update od 'authenticated' skončí max. v 'draft' (neviditelné).
-- Spustit PO supabase_schema.sql. Bezpečně opakovatelné.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Tabulka approval tokenů (píše jen service_role z Edge Function)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.moderation_approvals (
  token        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  image_count  SMALLINT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at   TIMESTAMPTZ NOT NULL DEFAULT now() + interval '30 minutes',
  consumed_at  TIMESTAMPTZ,

  CONSTRAINT moderation_approvals_image_count_check
    CHECK (image_count BETWEEN 0 AND 6)
);

CREATE INDEX IF NOT EXISTS moderation_approvals_user_idx
  ON public.moderation_approvals (user_id, created_at);

-- RLS zapnuté, ŽÁDNÉ policy pro anon/authenticated → čte/píše jen service_role
-- (bypass RLS) a SECURITY DEFINER funkce (vlastník). Žádný GRANT pro authenticated.
ALTER TABLE public.moderation_approvals ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 2. Zúžení INSERT policy — authenticated nikdy nevloží 'active'
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS posts_insert_own ON public.posts;
CREATE POLICY posts_insert_own ON public.posts
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND status = 'draft'
  );

-- -----------------------------------------------------------------------------
-- 3. Publish gate trigger na posts
--    Pro anon/authenticated (bez transakčního flagu z publish RPC a bez role
--    moderátor/admin) platí:
--    a) editace obsahu (název/popis/kategorie) → status 'draft' = re-moderace;
--       kryje i editaci pozastaveného/expirovaného inzerátu, která by jinak
--       šla živě přes pozdější unpause/prodloužení,
--    b) do viditelného stavu ('active'/'hidden'/'archived') se lze dostat jen
--       z jiného viditelného stavu (unpause, prodloužení). Z 'draft'/'deleted'
--       vede ven výhradně publish_approved_post — blokuje i vícekrokové
--       obchvaty (draft→hidden→active, draft→deleted→active).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_post_publish_gate()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_gate BOOLEAN := COALESCE(current_setting('app.publish_gate', true) = 'on', false);
  -- Omezené jen API role anon/authenticated; service_role, přímé DB session
  -- (migrace, SQL editor) a moderátor/admin projdou.
  v_privileged BOOLEAN :=
    COALESCE(auth.role(), '') NOT IN ('anon', 'authenticated')
    OR public.is_moderator_or_admin();
BEGIN
  IF v_gate OR v_privileged THEN
    RETURN NEW;
  END IF;

  -- a) Editace obsahu → 'draft' (mazání se nemění).
  IF TG_OP = 'UPDATE'
     AND NEW.status <> 'deleted'
     AND (
       NEW.title IS DISTINCT FROM OLD.title
       OR NEW.description IS DISTINCT FROM OLD.description
       OR NEW.category_type IS DISTINCT FROM OLD.category_type
       OR NEW.subcategory_slug IS DISTINCT FROM OLD.subcategory_slug
     ) THEN
    NEW.status := 'draft';
    RETURN NEW;
  END IF;

  -- b) Do viditelného stavu jen z jiného viditelného stavu (obsah se v tomto
  --    UPDATE nemění — viz větev a). Z 'draft'/'deleted' jen přes publish RPC.
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

DROP TRIGGER IF EXISTS trg_posts_publish_gate ON public.posts;
CREATE TRIGGER trg_posts_publish_gate
  BEFORE INSERT OR UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_post_publish_gate();

-- -----------------------------------------------------------------------------
-- 4. Změna fotek zveřejnitelného inzerátu bez povolení → zpět do 'draft'
--    Uzavírá vektor „přidám nemoderované fotky k aktivnímu (nebo pauznutému
--    a později obnovenému) inzerátu“. U nového inzerátu (draft) se neuplatní.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.revert_post_on_image_change()
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
  IF NOT (v_gate OR v_privileged) THEN
    UPDATE public.posts
    SET status = 'draft'
    WHERE id = COALESCE(NEW.post_id, OLD.post_id)
      AND status IN ('active', 'hidden', 'archived');
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_post_images_revert ON public.post_images;
CREATE TRIGGER trg_post_images_revert
  AFTER INSERT OR DELETE ON public.post_images
  FOR EACH ROW
  EXECUTE FUNCTION public.revert_post_on_image_change();

-- -----------------------------------------------------------------------------
-- 5. Vydání approval tokenu — volá JEN service_role z Edge Function
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.issue_moderation_approval(
  p_user_id     UUID,
  p_image_count INTEGER
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token UUID;
BEGIN
  INSERT INTO public.moderation_approvals (user_id, image_count)
  VALUES (p_user_id, GREATEST(0, LEAST(6, COALESCE(p_image_count, 0))))
  RETURNING token INTO v_token;
  RETURN v_token;
END;
$$;

REVOKE ALL ON FUNCTION public.issue_moderation_approval(UUID, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.issue_moderation_approval(UUID, INTEGER) TO service_role;

-- -----------------------------------------------------------------------------
-- 6. Publikace přes spotřebování tokenu — jediná cesta z 'draft' ven.
--    p_target: 'active' (create, edit aktivního) nebo 'hidden' (edit
--    pauznutého inzerátu — schválený obsah, ale zůstává pauznutý).
--    Inzerát v jiném stavu než 'draft' se nemění ('hidden' z karantény
--    moderátora se tudy NEaktivuje).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.publish_approved_post(
  p_post_id BIGINT,
  p_token   UUID,
  p_target  TEXT DEFAULT 'active'
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

  -- Image binding: nelze publikovat víc fotek, než prošlo bezpečnostním filtrem.
  SELECT count(*) INTO v_image_count
  FROM public.post_images
  WHERE post_id = p_post_id;

  IF v_image_count > v_approval.image_count THEN
    RAISE EXCEPTION 'image_set_mismatch' USING errcode = '42501';
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

REVOKE ALL ON FUNCTION public.publish_approved_post(BIGINT, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.publish_approved_post(BIGINT, UUID, TEXT) TO authenticated;
