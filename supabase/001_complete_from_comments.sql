-- =============================================================================
-- Doplneni schématu od comments (profiles, posts, post_images uz existuji)
-- Spustit CELÝ soubor (Ctrl+A -> Run)
-- =============================================================================


-- comments (GDPR: user_id ON DELETE SET NULL)
CREATE TABLE IF NOT EXISTS public.comments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id          BIGINT NOT NULL REFERENCES public.posts (id) ON DELETE CASCADE,
  user_id          UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  author_nickname  VARCHAR(50) NOT NULL,
  body             TEXT NOT NULL,
  status           public.comment_status NOT NULL DEFAULT 'active',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT comments_body_not_empty CHECK (char_length(trim(body)) > 0),
  CONSTRAINT comments_author_nickname_not_empty CHECK (char_length(trim(author_nickname)) > 0),
  CONSTRAINT comments_body_length_check CHECK (char_length(body) <= 2000)
);

-- reports (target_post_id BIGINT | target_comment_id UUID — dle target_type)
CREATE TABLE IF NOT EXISTS public.reports (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type       public.report_target_type NOT NULL,
  target_post_id    BIGINT REFERENCES public.posts (id) ON DELETE CASCADE,
  target_comment_id UUID REFERENCES public.comments (id) ON DELETE CASCADE,
  reporter_user_id  UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  reason            public.report_reason NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT reports_target_xor CHECK (
    (target_type = 'post' AND target_post_id IS NOT NULL AND target_comment_id IS NULL)
    OR
    (target_type = 'comment' AND target_comment_id IS NOT NULL AND target_post_id IS NULL)
  )
);

-- contact_reveals
CREATE TABLE IF NOT EXISTS public.contact_reveals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id         BIGINT NOT NULL REFERENCES public.posts (id) ON DELETE CASCADE,
  viewer_user_id  UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  revealed_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- rate_limits
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  action_type   public.rate_limit_action NOT NULL,
  count         INTEGER NOT NULL DEFAULT 1,
  window_start  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT rate_limits_count_positive CHECK (count > 0),
  CONSTRAINT rate_limits_unique_window
    UNIQUE (user_id, action_type, window_start)
);

-- -----------------------------------------------------------------------------
-- 5. INDEXES
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS posts_user_id_idx ON public.posts (user_id);
CREATE INDEX IF NOT EXISTS posts_status_expires_idx ON public.posts (status, expires_at);
CREATE INDEX IF NOT EXISTS posts_category_idx ON public.posts (category_type, subcategory_slug);
CREATE INDEX IF NOT EXISTS posts_search_vector_idx ON public.posts USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS posts_location_gist_idx ON public.posts USING GIST (location);

CREATE INDEX IF NOT EXISTS post_images_post_id_idx ON public.post_images (post_id);

CREATE INDEX IF NOT EXISTS comments_post_id_idx ON public.comments (post_id);
CREATE INDEX IF NOT EXISTS comments_user_id_idx ON public.comments (user_id);
CREATE INDEX IF NOT EXISTS comments_status_idx ON public.comments (status);

CREATE INDEX IF NOT EXISTS reports_target_post_idx ON public.reports (target_post_id) WHERE target_post_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS reports_target_comment_idx ON public.reports (target_comment_id) WHERE target_comment_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS reports_one_per_user_per_post_idx
  ON public.reports (reporter_user_id, target_post_id)
  WHERE target_post_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS reports_one_per_user_per_comment_idx
  ON public.reports (reporter_user_id, target_comment_id)
  WHERE target_comment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS reports_reporter_idx ON public.reports (reporter_user_id);

CREATE INDEX IF NOT EXISTS contact_reveals_viewer_idx ON public.contact_reveals (viewer_user_id, revealed_at);
CREATE INDEX IF NOT EXISTS contact_reveals_post_idx ON public.contact_reveals (post_id);

CREATE INDEX IF NOT EXISTS rate_limits_user_action_idx ON public.rate_limits (user_id, action_type, window_start);

-- -----------------------------------------------------------------------------
-- 6. BUSINESS LOGIC TRIGGERS
-- -----------------------------------------------------------------------------

-- Snapshot author_nickname při INSERT komentáře (ignoruje hodnotu z klienta)
CREATE OR REPLACE FUNCTION public.set_comment_author_nickname()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    RAISE EXCEPTION 'user_id is required for new comments';
  END IF;

  SELECT p.nickname INTO NEW.author_nickname
  FROM public.profiles p
  WHERE p.id = NEW.user_id;

  IF NEW.author_nickname IS NULL THEN
    RAISE EXCEPTION 'Profile with nickname not found for user %', NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_comments_set_author_nickname ON public.comments;
CREATE TRIGGER trg_comments_set_author_nickname
  BEFORE INSERT ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_comment_author_nickname();

-- Max 6 fotografií na inzerát
CREATE OR REPLACE FUNCTION public.enforce_max_post_images()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  image_count INTEGER;
BEGIN
  SELECT count(*) INTO image_count
  FROM public.post_images
  WHERE post_id = NEW.post_id;

  IF image_count >= 6 THEN
    RAISE EXCEPTION 'Maximum 6 images per post exceeded';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_post_images_max_six ON public.post_images;
CREATE TRIGGER trg_post_images_max_six
  BEFORE INSERT ON public.post_images
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_max_post_images();

-- Auto-hide po 3 unikátních nahlášeních
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
      SET status = 'hidden', updated_at = now()
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

DROP TRIGGER IF EXISTS trg_reports_threshold ON public.reports;
CREATE TRIGGER trg_reports_threshold
  AFTER INSERT ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.check_report_threshold();

-- Zabránění eskalaci role (jen admin mění role)
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can change user roles';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_prevent_role_escalation ON public.profiles;
CREATE TRIGGER trg_profiles_prevent_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_escalation();

-- updated_at
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_posts_updated_at ON public.posts;
CREATE TRIGGER trg_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Vytvoření profilu po registraci (Google OAuth: name, picture z raw_user_meta_data)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nickname, email, name, avatar_url, role)
  VALUES (
    NEW.id,
    'user_' || substr(replace(NEW.id::text, '-', ''), 1, 12),
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data ->> 'full_name',
      NEW.raw_user_meta_data ->> 'name'
    ),
    COALESCE(
      NEW.raw_user_meta_data ->> 'avatar_url',
      NEW.raw_user_meta_data ->> 'picture'
    ),
    'user'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

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
