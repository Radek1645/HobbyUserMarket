-- =============================================================================
-- 036 — Stav 'blocked': inzerát skrytý moderací / nahlášením.
--         Vlastník se dostane ven jen úpravou obsahu → draft → re-moderace.
-- =============================================================================

ALTER TYPE public.post_status ADD VALUE IF NOT EXISTS 'blocked';

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS status_reason_code TEXT;

ALTER TABLE public.posts
  DROP CONSTRAINT IF EXISTS posts_status_reason_code_check;

ALTER TABLE public.posts
  ADD CONSTRAINT posts_status_reason_code_check
  CHECK (
    status_reason_code IS NULL
    OR status_reason_code IN ('reports_threshold', 'moderation')
  );

-- Auto-block po 3 unikátních nahlášeních (místo 'hidden').
CREATE OR REPLACE FUNCTION public.check_report_threshold()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  report_count INTEGER;
BEGIN
  SELECT count(DISTINCT reporter_user_id) INTO report_count
  FROM public.reports
  WHERE target_type = NEW.target_type
    AND (
      (NEW.target_type = 'post' AND target_post_id = NEW.target_post_id)
      OR
      (NEW.target_type = 'comment' AND target_comment_id = NEW.target_comment_id)
    );

  IF report_count >= 3 THEN
    IF NEW.target_type = 'post' THEN
      UPDATE public.posts
      SET
        status = 'blocked',
        status_reason_code = 'reports_threshold',
        updated_at = now()
      WHERE id = NEW.target_post_id
        AND status = 'active';
    ELSIF NEW.target_type = 'comment' THEN
      UPDATE public.comments
      SET status = 'hidden'
      WHERE id = NEW.target_comment_id
        AND status = 'active';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Publish gate: editace z 'blocked' → 'draft', bez přímého zveřejnění.
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

-- Změna fotek u blocked inzerátu → draft (stejně jako u ostatních viditelných).
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
    SET status = 'draft', status_reason_code = NULL
    WHERE id = COALESCE(NEW.post_id, OLD.post_id)
      AND status IN ('active', 'hidden', 'archived', 'blocked');
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;
