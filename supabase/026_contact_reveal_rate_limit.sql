-- =============================================================================
-- 026 — Rate limit odhalení kontaktu (audit M1, PRD §5.3)
-- Max 20 odhalených kontaktů / 24 h / uživatel. Počítá se počet UNIKÁTNÍCH
-- inzerátů (opětovné otevření téhož inzerátu limit nespotřebovává).
-- Rozšiřuje reveal_listing_contact z migrace 025.
-- Spustit PO 025. Bezpečně opakovatelné (CREATE OR REPLACE).
-- =============================================================================

CREATE OR REPLACE FUNCTION public.reveal_listing_contact(p_post_id BIGINT)
RETURNS TABLE (email TEXT, phone TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_uid     UUID := auth.uid();
  v_post    RECORD;
  v_email   TEXT;
  v_phone   TEXT;
  v_limit   INTEGER := 20;  -- PRD §5.3
  v_count   INTEGER;
  v_already BOOLEAN;
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

  -- Rate limit (M1): počet unikátních inzerátů odhalených v posledních 24 h.
  SELECT
    count(DISTINCT cr.post_id),
    bool_or(cr.post_id = p_post_id)
  INTO v_count, v_already
  FROM public.contact_reveals cr
  WHERE cr.viewer_user_id = v_uid
    AND cr.revealed_at > now() - interval '1 day';

  -- Opětovné otevření již odhaleného inzerátu limit nespotřebovává.
  IF COALESCE(v_already, false) = false AND v_count >= v_limit THEN
    RAISE EXCEPTION 'contact_reveal_rate_limited' USING errcode = 'P0001';
  END IF;

  INSERT INTO public.contact_reveals (post_id, viewer_user_id)
  VALUES (p_post_id, v_uid);

  RETURN QUERY SELECT v_email, v_phone;
END;
$$;

REVOKE ALL ON FUNCTION public.reveal_listing_contact(BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reveal_listing_contact(BIGINT) TO authenticated;
