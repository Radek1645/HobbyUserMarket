-- =============================================================================
-- 047 — Security column guards (M3, M4)
--   M3: uživatel nesmí sám nastavit company_ico_verified = true
--   M4: payment_status / renew_count / expires_at mimo oprávněné toky
--   (sloupec expiry_warning_for_expires_at chrání 048 — po nasazení 048 platí rozšířená verze)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- M3 — company_ico_verified jen admin (nebo service_role / ne-API role)
-- -----------------------------------------------------------------------------
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
BEGIN
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

DROP TRIGGER IF EXISTS trg_profiles_prevent_ico_verified ON public.profiles;
CREATE TRIGGER trg_profiles_prevent_ico_verified
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_ico_verified_escalation();

-- -----------------------------------------------------------------------------
-- M4 — privilegované sloupce posts
--   payment_status: neměnitelné pro anon/authenticated
--   renew_count: jen +1 (prodloužení)
--   expires_at: jen s renew +1, nebo při změpočtu z duration/event/category
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
BEGIN
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
    RETURN NEW;
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
    -- Prodloužení smí posunout expires_at, max ~365 dní dopředu (+1 den buffer).
    IF NEW.expires_at IS NOT NULL
       AND NEW.expires_at > (now() + INTERVAL '366 days') THEN
      RAISE EXCEPTION 'expires_at exceeds allowed range'
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

    IF NEW.expires_at IS NOT NULL
       AND NEW.expires_at > (now() + INTERVAL '366 days') THEN
      RAISE EXCEPTION 'expires_at exceeds allowed range'
        USING errcode = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_posts_protect_privileged_columns ON public.posts;
CREATE TRIGGER trg_posts_protect_privileged_columns
  BEFORE INSERT OR UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_post_privileged_columns();
