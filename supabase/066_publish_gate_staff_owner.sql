-- =============================================================================
-- 066 — publish gate: staff výjimka nesmí obejít moderaci vlastního inzerátu
--
-- Moderátor/admin používá pro vlastní inzeráty stejný uživatelský flow jako
-- běžný vlastník. Privilegovaný bypass zůstává jen pro God Mode úpravu cizího
-- inzerátu a pro service_role.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.enforce_post_publish_gate()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_gate BOOLEAN := COALESCE(
    current_setting('app.publish_gate', true) = 'on',
    false
  );
  v_privileged BOOLEAN :=
    COALESCE(auth.role(), '') NOT IN ('anon', 'authenticated');
BEGIN
  IF NOT v_privileged
     AND public.is_moderator_or_admin()
     AND NEW.user_id IS DISTINCT FROM auth.uid() THEN
    v_privileged := true;
  END IF;

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
