-- =============================================================================
-- 025 — Ochrana PII kontaktů (audit C1 + C2)
-- C1: zrušit plošné čtení profiles; e-mail jen přes reveal RPC
-- C2: contact_phone nedostupný přes veřejné SELECT; jen přes RPC
-- Pořadí: spustit PO supabase_schema.sql (kvůli column-level REVOKE na posts).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- C1: profiles — konec plošného čtení cizích profilů (dřív USING(true))
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS profiles_select_public ON public.profiles;

-- Admin potřebuje seznam profilů pro /mod/uzivatele (PRD §5.6, jen admin).
DROP POLICY IF EXISTS profiles_select_admin ON public.profiles;
CREATE POLICY profiles_select_admin ON public.profiles
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- C1: reveal RPC — e-mail + telefon jedním voláním, jen odtud se vrací PII
-- SECURITY DEFINER: ověří přihlášení, viditelnost inzerátu (M2), opt-in vlajky,
-- zaloguje contact_reveals.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reveal_listing_contact(p_post_id BIGINT)
RETURNS TABLE (email TEXT, phone TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_uid   UUID := auth.uid();
  v_post  RECORD;
  v_email TEXT;
  v_phone TEXT;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING errcode = '28000';
  END IF;

  SELECT p.user_id, p.status, p.expires_at,
         p.show_contact_email, p.show_contact_phone, p.contact_phone
    INTO v_post
  FROM public.posts p
  WHERE p.id = p_post_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Defense in depth: neodhaluj kontakt u neveřejného inzerátu (M2).
  IF NOT public.is_post_publicly_visible(v_post.status, v_post.expires_at) THEN
    RETURN;
  END IF;

  IF v_post.show_contact_email THEN
    SELECT NULLIF(trim(pr.email), '') INTO v_email
    FROM public.profiles pr WHERE pr.id = v_post.user_id;
  END IF;

  IF v_post.show_contact_phone THEN
    v_phone := NULLIF(trim(v_post.contact_phone), '');
  END IF;

  IF v_email IS NULL AND v_phone IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.contact_reveals (post_id, viewer_user_id)
  VALUES (p_post_id, v_uid);

  RETURN QUERY SELECT v_email, v_phone;
END;
$$;

REVOKE ALL ON FUNCTION public.reveal_listing_contact(BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reveal_listing_contact(BIGINT) TO authenticated;

-- -----------------------------------------------------------------------------
-- C2: contact_phone pro vlastníka (předvyplnění při editaci)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_owned_post_contact_phone(p_post_id BIGINT)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.contact_phone
  FROM public.posts p
  WHERE p.id = p_post_id AND p.user_id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.get_owned_post_contact_phone(BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_owned_post_contact_phone(BIGINT) TO authenticated;

-- -----------------------------------------------------------------------------
-- C2: odebrat čtení sloupce contact_phone z veřejných rolí
-- RLS filtruje řádky, ne sloupce → nutná column-level pojistka.
-- service_role si čtení ponechává (poptávkové API, admin).
-- -----------------------------------------------------------------------------
REVOKE SELECT (contact_phone) ON public.posts FROM anon, authenticated;
