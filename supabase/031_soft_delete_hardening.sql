-- =============================================================================
-- 031 — Soft delete: publish gate explicit bypass + storage cleanup nesmí
--         rollbacknout změnu statusu na 'deleted'.
-- =============================================================================

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

  -- Vlastník smí soft-delete bez publish tokenu / re-moderace.
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

CREATE OR REPLACE FUNCTION public.cleanup_post_storage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  paths TEXT[];
BEGIN
  IF TG_OP = 'DELETE' THEN
    SELECT array_agg(storage_path) INTO paths
    FROM public.post_images
    WHERE post_id = OLD.id;

    IF paths IS NOT NULL THEN
      BEGIN
        DELETE FROM storage.objects
        WHERE bucket_id = 'post-images'
          AND name = ANY (paths);
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'cleanup_post_storage (delete %): %', OLD.id, SQLERRM;
      END;
    END IF;

    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status = 'deleted' AND OLD.status IS DISTINCT FROM 'deleted' THEN
    SELECT array_agg(storage_path) INTO paths
    FROM public.post_images
    WHERE post_id = NEW.id;

    IF paths IS NOT NULL THEN
      BEGIN
        DELETE FROM storage.objects
        WHERE bucket_id = 'post-images'
          AND name = ANY (paths);
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'cleanup_post_storage (soft-delete %): %', NEW.id, SQLERRM;
      END;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
