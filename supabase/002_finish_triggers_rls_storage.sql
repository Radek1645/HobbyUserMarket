-- =============================================================================
-- Dokonceni po chybe permission denied for schema auth
-- Spustit pokud 001 spadl na auth.prevent_email_change (Ctrl+A -> Run)
-- =============================================================================

-- Striktní zákaz změny e-mailu (PRD §5.2)
-- Funkce musí být v public — auth schema je v Supabase SQL Editoru chráněné
CREATE OR REPLACE FUNCTION public.prevent_email_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.email IS DISTINCT FROM NEW.email THEN
    RAISE EXCEPTION 'Email change is not allowed. Delete account and create a new one.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_email_change ON auth.users;
CREATE TRIGGER trg_prevent_email_change
  BEFORE UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_email_change();

-- Úklid Storage při smazání / soft-delete inzerátu
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
      DELETE FROM storage.objects
      WHERE bucket_id = 'post-images'
        AND name = ANY (paths);
    END IF;

    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status = 'deleted' AND OLD.status IS DISTINCT FROM 'deleted' THEN
    SELECT array_agg(storage_path) INTO paths
    FROM public.post_images
    WHERE post_id = NEW.id;

    IF paths IS NOT NULL THEN
      DELETE FROM storage.objects
      WHERE bucket_id = 'post-images'
        AND name = ANY (paths);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_posts_cleanup_storage ON public.posts;
CREATE TRIGGER trg_posts_cleanup_storage
  AFTER DELETE OR UPDATE OF status ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_post_storage();

-- -----------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_reveals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- profiles
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS profiles_select_public ON public.profiles;
CREATE POLICY profiles_select_public ON public.profiles
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS profiles_update_admin ON public.profiles;
CREATE POLICY profiles_update_admin ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS profiles_delete_own ON public.profiles;
CREATE POLICY profiles_delete_own ON public.profiles
  FOR DELETE TO authenticated
  USING (id = auth.uid());

-- posts
DROP POLICY IF EXISTS posts_select_public ON public.posts;
CREATE POLICY posts_select_public ON public.posts
  FOR SELECT TO anon, authenticated
  USING (public.is_post_publicly_visible(status, expires_at));

DROP POLICY IF EXISTS posts_select_own ON public.posts;
CREATE POLICY posts_select_own ON public.posts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS posts_select_moderator ON public.posts;
CREATE POLICY posts_select_moderator ON public.posts
  FOR SELECT TO authenticated
  USING (public.is_moderator_or_admin());

DROP POLICY IF EXISTS posts_insert_own ON public.posts;
CREATE POLICY posts_insert_own ON public.posts
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS posts_update_own ON public.posts;
CREATE POLICY posts_update_own ON public.posts
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS posts_update_moderator ON public.posts;
CREATE POLICY posts_update_moderator ON public.posts
  FOR UPDATE TO authenticated
  USING (public.is_moderator_or_admin())
  WITH CHECK (public.is_moderator_or_admin());

DROP POLICY IF EXISTS posts_delete_own ON public.posts;
CREATE POLICY posts_delete_own ON public.posts
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS posts_delete_moderator ON public.posts;
CREATE POLICY posts_delete_moderator ON public.posts
  FOR DELETE TO authenticated
  USING (public.is_moderator_or_admin());

-- post_images
DROP POLICY IF EXISTS post_images_select_public ON public.post_images;
CREATE POLICY post_images_select_public ON public.post_images
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = post_images.post_id
        AND public.is_post_publicly_visible(p.status, p.expires_at)
    )
  );

DROP POLICY IF EXISTS post_images_select_own ON public.post_images;
CREATE POLICY post_images_select_own ON public.post_images
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = post_images.post_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS post_images_select_moderator ON public.post_images;
CREATE POLICY post_images_select_moderator ON public.post_images
  FOR SELECT TO authenticated
  USING (public.is_moderator_or_admin());

DROP POLICY IF EXISTS post_images_insert_own ON public.post_images;
CREATE POLICY post_images_insert_own ON public.post_images
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = post_images.post_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS post_images_update_own ON public.post_images;
CREATE POLICY post_images_update_own ON public.post_images
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = post_images.post_id AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = post_images.post_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS post_images_delete_own ON public.post_images;
CREATE POLICY post_images_delete_own ON public.post_images
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = post_images.post_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS post_images_delete_moderator ON public.post_images;
CREATE POLICY post_images_delete_moderator ON public.post_images
  FOR DELETE TO authenticated
  USING (public.is_moderator_or_admin());

-- comments
DROP POLICY IF EXISTS comments_select_public ON public.comments;
CREATE POLICY comments_select_public ON public.comments
  FOR SELECT TO anon, authenticated
  USING (
    status = 'active'
    AND EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = comments.post_id
        AND public.is_post_publicly_visible(p.status, p.expires_at)
    )
  );

DROP POLICY IF EXISTS comments_select_own ON public.comments;
CREATE POLICY comments_select_own ON public.comments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS comments_select_moderator ON public.comments;
CREATE POLICY comments_select_moderator ON public.comments
  FOR SELECT TO authenticated
  USING (public.is_moderator_or_admin());

DROP POLICY IF EXISTS comments_insert_authenticated ON public.comments;
CREATE POLICY comments_insert_authenticated ON public.comments
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = comments.post_id
        AND public.is_post_publicly_visible(p.status, p.expires_at)
    )
  );

DROP POLICY IF EXISTS comments_update_own ON public.comments;
CREATE POLICY comments_update_own ON public.comments
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS comments_update_moderator ON public.comments;
CREATE POLICY comments_update_moderator ON public.comments
  FOR UPDATE TO authenticated
  USING (public.is_moderator_or_admin())
  WITH CHECK (public.is_moderator_or_admin());

DROP POLICY IF EXISTS comments_delete_own ON public.comments;
CREATE POLICY comments_delete_own ON public.comments
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS comments_delete_moderator ON public.comments;
CREATE POLICY comments_delete_moderator ON public.comments
  FOR DELETE TO authenticated
  USING (public.is_moderator_or_admin());

-- reports
DROP POLICY IF EXISTS reports_select_own ON public.reports;
CREATE POLICY reports_select_own ON public.reports
  FOR SELECT TO authenticated
  USING (reporter_user_id = auth.uid());

DROP POLICY IF EXISTS reports_select_moderator ON public.reports;
CREATE POLICY reports_select_moderator ON public.reports
  FOR SELECT TO authenticated
  USING (public.is_moderator_or_admin());

DROP POLICY IF EXISTS reports_insert_authenticated ON public.reports;
CREATE POLICY reports_insert_authenticated ON public.reports
  FOR INSERT TO authenticated
  WITH CHECK (reporter_user_id = auth.uid());

-- contact_reveals
DROP POLICY IF EXISTS contact_reveals_select_own ON public.contact_reveals;
CREATE POLICY contact_reveals_select_own ON public.contact_reveals
  FOR SELECT TO authenticated
  USING (viewer_user_id = auth.uid());

DROP POLICY IF EXISTS contact_reveals_select_moderator ON public.contact_reveals;
CREATE POLICY contact_reveals_select_moderator ON public.contact_reveals
  FOR SELECT TO authenticated
  USING (public.is_moderator_or_admin());

DROP POLICY IF EXISTS contact_reveals_insert_own ON public.contact_reveals;
CREATE POLICY contact_reveals_insert_own ON public.contact_reveals
  FOR INSERT TO authenticated
  WITH CHECK (
    viewer_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = contact_reveals.post_id
        AND public.is_post_publicly_visible(p.status, p.expires_at)
    )
  );

-- rate_limits
DROP POLICY IF EXISTS rate_limits_select_own ON public.rate_limits;
CREATE POLICY rate_limits_select_own ON public.rate_limits
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS rate_limits_insert_own ON public.rate_limits;
CREATE POLICY rate_limits_insert_own ON public.rate_limits
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS rate_limits_update_own ON public.rate_limits;
CREATE POLICY rate_limits_update_own ON public.rate_limits
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 8. STORAGE BUCKET (post-images)
-- -----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-images', 'post-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS post_images_storage_select ON storage.objects;
CREATE POLICY post_images_storage_select ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'post-images');

DROP POLICY IF EXISTS post_images_storage_insert ON storage.objects;
CREATE POLICY post_images_storage_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'post-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS post_images_storage_update ON storage.objects;
CREATE POLICY post_images_storage_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'post-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS post_images_storage_delete ON storage.objects;
CREATE POLICY post_images_storage_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'post-images'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR public.is_moderator_or_admin()
    )
  );
