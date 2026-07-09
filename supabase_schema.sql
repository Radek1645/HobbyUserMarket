-- =============================================================================
-- HobbyUserMarket — Supabase PostgreSQL Schema (PRD v3.1)
-- Čistý start: 1) supabase/000_reset_database.sql  2) tento soubor
-- ⚠️  Spusť CELÝ soubor (Ctrl+A → Run)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. EXTENSIONS
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

-- -----------------------------------------------------------------------------
-- 2. ENUM TYPES
-- -----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('user', 'moderator', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.post_status AS ENUM ('draft', 'active', 'archived', 'hidden', 'blocked', 'deleted');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.comment_status AS ENUM ('active', 'hidden');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.report_target_type AS ENUM ('post', 'comment');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.report_reason AS ENUM ('fraud', 'illegal', 'inappropriate');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.rate_limit_action AS ENUM ('ai_check', 'contact_reveal', 'comment');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- -----------------------------------------------------------------------------
-- 3. HELPER FUNCTIONS (bez závislosti na tabulkách)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_post_publicly_visible(p_status public.post_status, p_expires_at TIMESTAMPTZ)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT p_status = 'active' AND (p_expires_at IS NULL OR p_expires_at > now());
$$;

-- -----------------------------------------------------------------------------
-- 4. TABLES
-- -----------------------------------------------------------------------------

-- profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  profile_no      BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE,
  nickname        VARCHAR(50) NOT NULL,
  name            VARCHAR(100),
  surname         VARCHAR(100),
  email           TEXT,
  phone           VARCHAR(30),
  avatar_url      TEXT,
  is_company      BOOLEAN NOT NULL DEFAULT false,
  company_name    VARCHAR(150),
  company_ico     VARCHAR(8),
  company_ico_verified BOOLEAN NOT NULL DEFAULT false,
  role            public.user_role NOT NULL DEFAULT 'user',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT profiles_nickname_unique UNIQUE (nickname),
  CONSTRAINT profiles_nickname_not_empty CHECK (char_length(trim(nickname)) > 0),

  CONSTRAINT profiles_company_fields_check
    CHECK (
      (
        is_company = false
        AND company_name IS NULL
        AND company_ico IS NULL
      )
      OR (
        is_company = true
        AND company_name IS NOT NULL
        AND char_length(trim(company_name)) BETWEEN 2 AND 150
      )
    ),

  CONSTRAINT profiles_company_ico_format_check
    CHECK (company_ico IS NULL OR company_ico ~ '^\d{8}$')
);

-- RBAC helper funkce (vyžadují existující tabulku profiles)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_moderator_or_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('moderator', 'admin')
  );
$$;

-- posts
CREATE TABLE IF NOT EXISTS public.posts (
  id                BIGSERIAL PRIMARY KEY,
  user_id           UUID NOT NULL REFERENCES auth.users (id) ON DELETE RESTRICT,
  title             TEXT NOT NULL,
  description       TEXT NOT NULL DEFAULT '',
  original_title    TEXT,
  original_description TEXT,
  category_type     VARCHAR(10) NOT NULL,
  subcategory_slug  VARCHAR(50) NOT NULL,
  price_type        VARCHAR(20) NOT NULL,
  price_amount      INTEGER,
  exchange_for      VARCHAR(100),
  condition_label   VARCHAR(20) NOT NULL,
  location_text     TEXT NOT NULL,
  location          extensions.geography(POINT, 4326) NOT NULL,
  status            public.post_status NOT NULL DEFAULT 'draft',
  status_reason_code TEXT,
  expires_at        TIMESTAMPTZ,
  renew_count       INTEGER NOT NULL DEFAULT 0,
  payment_status    VARCHAR(20) NOT NULL DEFAULT 'free',
  main_image_url    TEXT,
  slug              VARCHAR(200) NOT NULL,
  search_vector     TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, ''))
  ) STORED,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT posts_category_type_check
    CHECK (category_type IN ('zbozi', 'sluzby', 'udalost', 'nemovitost', 'prace')),

  CONSTRAINT posts_price_type_check
    CHECK (price_type IN ('fixed', 'free_pickup', 'negotiable', 'exchange', 'offer')),

  CONSTRAINT posts_condition_label_check
    CHECK (condition_label IN (
      'new', 'like_new', 'used', 'damaged',
      'one_time', 'long_term', 'substitute',
      'sale', 'rent'
    )),

  CONSTRAINT posts_condition_matches_category_check
    CHECK (
      (category_type = 'zbozi' AND condition_label IN ('new', 'like_new', 'used', 'damaged'))
      OR
      (category_type = 'sluzby' AND condition_label IN ('one_time', 'long_term', 'substitute'))
      OR
      (category_type = 'udalost' AND condition_label IN ('one_time', 'long_term'))
      OR
      (category_type = 'nemovitost' AND condition_label IN ('sale', 'rent'))
      OR
      (category_type = 'prace' AND condition_label IN ('one_time', 'long_term', 'substitute'))
    ),

  CONSTRAINT posts_price_amount_fixed_check
    CHECK (
      (price_type = 'fixed' AND price_amount IS NOT NULL AND price_amount >= 0)
      OR
      (price_type <> 'fixed' AND (price_amount IS NULL OR price_amount >= 0))
    ),

  CONSTRAINT posts_exchange_for_check
    CHECK (
      (
        price_type = 'exchange'
        AND (
          exchange_for IS NULL
          OR char_length(trim(exchange_for)) BETWEEN 1 AND 100
        )
      )
      OR (price_type <> 'exchange' AND exchange_for IS NULL)
    ),

  CONSTRAINT posts_title_length_check
    CHECK (char_length(title) BETWEEN 1 AND 80),

  CONSTRAINT posts_description_length_check
    CHECK (char_length(description) <= 2000),

  CONSTRAINT posts_original_title_length_check
    CHECK (original_title IS NULL OR char_length(original_title) BETWEEN 1 AND 80),

  CONSTRAINT posts_original_description_length_check
    CHECK (original_description IS NULL OR char_length(original_description) <= 2000),

  CONSTRAINT posts_subcategory_slug_not_empty
    CHECK (char_length(trim(subcategory_slug)) > 0),

  CONSTRAINT posts_slug_not_empty
    CHECK (char_length(trim(slug)) > 0),

  CONSTRAINT posts_payment_status_check
    CHECK (payment_status IN ('free', 'paid', 'pending')),

  CONSTRAINT posts_renew_count_non_negative
    CHECK (renew_count >= 0),

  CONSTRAINT posts_status_reason_code_check
    CHECK (
      status_reason_code IS NULL
      OR status_reason_code IN ('reports_threshold', 'moderation')
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS posts_slug_unique_idx ON public.posts (slug);

-- post_images
CREATE TABLE IF NOT EXISTS public.post_images (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id       BIGINT NOT NULL REFERENCES public.posts (id) ON DELETE CASCADE,
  storage_path  TEXT NOT NULL,
  url           TEXT NOT NULL,
  sort_order    SMALLINT NOT NULL DEFAULT 0,
  is_main       BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT post_images_sort_order_check CHECK (sort_order BETWEEN 0 AND 5),
  CONSTRAINT post_images_storage_path_not_empty CHECK (char_length(trim(storage_path)) > 0),
  CONSTRAINT post_images_url_not_empty CHECK (char_length(trim(url)) > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS post_images_one_main_per_post_idx
  ON public.post_images (post_id)
  WHERE is_main = true;

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

-- inquiry_events (metadata poptávek — PRD §11.1 C; rate limit H2)
CREATE TABLE IF NOT EXISTS public.inquiry_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_no      BIGINT GENERATED ALWAYS AS IDENTITY,
  post_id         BIGINT NOT NULL REFERENCES public.posts (id) ON DELETE CASCADE,
  viewer_user_id  UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  ip_address      TEXT NOT NULL,
  delivered       BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT inquiry_events_ip_not_empty CHECK (char_length(trim(ip_address)) > 0)
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

CREATE INDEX IF NOT EXISTS inquiry_events_ip_created_idx
  ON public.inquiry_events (ip_address, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS inquiry_events_inquiry_no_idx
  ON public.inquiry_events (inquiry_no);
CREATE INDEX IF NOT EXISTS inquiry_events_ip_post_created_idx
  ON public.inquiry_events (ip_address, post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS inquiry_events_post_created_idx
  ON public.inquiry_events (post_id, created_at DESC)
  WHERE delivered = true;

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
ALTER TABLE public.inquiry_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- profiles
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- Pozn.: cizí profily se NEČTOU plošně (PII). Veřejná ne-PII data zadavatele
-- jdou přes get_advertiser_display, e-mail/telefon přes reveal_listing_contact.
DROP POLICY IF EXISTS profiles_select_public ON public.profiles;

DROP POLICY IF EXISTS profiles_select_admin ON public.profiles;
CREATE POLICY profiles_select_admin ON public.profiles
  FOR SELECT TO authenticated
  USING (public.is_admin());

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

-- H1: authenticated nikdy nevloží 'active' — publikace jen přes publish_approved_post.
DROP POLICY IF EXISTS posts_insert_own ON public.posts;
CREATE POLICY posts_insert_own ON public.posts
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'draft');

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

-- inquiry_events
DROP POLICY IF EXISTS inquiry_events_select_moderator ON public.inquiry_events;
CREATE POLICY inquiry_events_select_moderator ON public.inquiry_events
  FOR SELECT TO authenticated
  USING (public.is_moderator_or_admin());

DROP POLICY IF EXISTS inquiry_events_select_post_owner ON public.inquiry_events;
CREATE POLICY inquiry_events_select_post_owner ON public.inquiry_events
  FOR SELECT TO authenticated
  USING (
    delivered = true
    AND EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = inquiry_events.post_id
        AND p.user_id = auth.uid()
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

-- =============================================================================
-- Table grants (RLS alone is not enough — authenticated role needs GRANT)
-- =============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON public.posts TO anon, authenticated, service_role;
GRANT INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.posts_id_seq TO authenticated;

GRANT SELECT ON public.profiles TO anon, authenticated, service_role;
GRANT INSERT, UPDATE, DELETE ON public.profiles TO authenticated;

GRANT SELECT ON public.post_images TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.post_images TO authenticated;

GRANT SELECT ON public.comments TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.comments TO authenticated;

GRANT SELECT, INSERT ON public.reports TO authenticated;
GRANT SELECT, INSERT ON public.contact_reveals TO authenticated;
GRANT SELECT ON public.inquiry_events TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.inquiry_events TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.rate_limits TO authenticated;

-- =============================================================================
-- 9. OCHRANA PII KONTAKTŮ (audit C1 + C2)
-- =============================================================================

-- C2: contact_phone nikdy nesmí jít přes veřejné SELECT (RLS filtruje řádky,
-- ne sloupce). MUSÍ být PO GRANT SELECT výše. service_role si čtení ponechává.
REVOKE SELECT (contact_phone) ON public.posts FROM anon, authenticated;

-- C1: odhalení e-mailu + telefonu jedním voláním — jediné místo, které vrací PII.
-- Ověří přihlášení, viditelnost inzerátu (M2), opt-in vlajky, rate limit (M1)
-- a zaloguje contact_reveals.
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
  -- Opětovné otevření již odhaleného inzerátu limit nespotřebovává.
  SELECT
    count(DISTINCT cr.post_id),
    bool_or(cr.post_id = p_post_id)
  INTO v_count, v_already
  FROM public.contact_reveals cr
  WHERE cr.viewer_user_id = v_uid
    AND cr.revealed_at > now() - interval '1 day';

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

-- C2: telefon vlastníkovi pro předvyplnění při editaci (contact_phone je jinak
-- pro authenticated nečitelný).
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

-- =============================================================================
-- 10. SERVER-SIDE VYNUCENÍ AI MODERACE (audit H1 + P14)
-- Publikace (status='active') je dosažitelná JEN přes publish_approved_post,
-- který spotřebuje approval token vydaný Edge Function po bezpečnostním filtru.
-- =============================================================================

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

-- Bez policy pro anon/authenticated → přístup jen service_role + SECURITY DEFINER.
ALTER TABLE public.moderation_approvals ENABLE ROW LEVEL SECURITY;

-- Publish gate (H1): pro anon/authenticated bez flagu z publish RPC a bez role
-- moderátor/admin platí:
--   a) editace obsahu (název/popis/kategorie) → status 'draft' = re-moderace,
--   b) do viditelného stavu ('active'/'hidden'/'archived') jen z jiného
--      viditelného stavu (unpause, prodloužení). Z 'draft'/'blocked'/'deleted'
--      vede ven výhradně publish_approved_post.
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

DROP TRIGGER IF EXISTS trg_posts_publish_gate ON public.posts;
CREATE TRIGGER trg_posts_publish_gate
  BEFORE INSERT OR UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_post_publish_gate();

-- Změna fotek zveřejnitelného inzerátu bez povolení → zpět 'draft'.
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

DROP TRIGGER IF EXISTS trg_post_images_revert ON public.post_images;
CREATE TRIGGER trg_post_images_revert
  AFTER INSERT OR DELETE ON public.post_images
  FOR EACH ROW
  EXECUTE FUNCTION public.revert_post_on_image_change();

-- Vydání approval tokenu — volá jen service_role z Edge Function.
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

-- Publikace přes spotřebování tokenu — jediná cesta z 'draft' ven.
-- p_target: 'active' (create, edit aktivního) nebo 'hidden' (edit pauznutého —
-- schválený obsah, ale zůstává pauznutý). Jiný stav než 'draft' se nemění.
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

-- =============================================================================
-- 11. LOG AI MODERACE (028)
-- Append-only záznam volání moderate-listing — čte moderátor/admin.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.moderation_checks (
  log_no               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id              UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  intent               TEXT,
  status               TEXT NOT NULL,
  category_type        TEXT,
  subcategory_slug     TEXT,
  image_count          SMALLINT NOT NULL DEFAULT 0,
  rejected_topic_id    TEXT,
  rejection_reason     TEXT,
  rejected_image_index SMALLINT,
  error_code           TEXT,
  title_preview        TEXT,

  CONSTRAINT moderation_checks_status_check
    CHECK (status IN ('APPROVED', 'REJECTED', 'NEEDS_QUESTIONS')),
  CONSTRAINT moderation_checks_image_count_check
    CHECK (image_count BETWEEN 0 AND 6)
);

CREATE INDEX IF NOT EXISTS moderation_checks_created_at_idx
  ON public.moderation_checks (created_at DESC);

CREATE INDEX IF NOT EXISTS moderation_checks_user_idx
  ON public.moderation_checks (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS moderation_checks_rejected_idx
  ON public.moderation_checks (created_at DESC)
  WHERE status = 'REJECTED';

ALTER TABLE public.moderation_checks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS moderation_checks_select_moderator ON public.moderation_checks;
CREATE POLICY moderation_checks_select_moderator ON public.moderation_checks
  FOR SELECT TO authenticated
  USING (public.is_moderator_or_admin());

GRANT INSERT, SELECT ON public.moderation_checks TO service_role;

-- =============================================================================
-- 12. CRON ARCHIVACE EXPIROVANÝCH INZERÁTŮ (035)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.archive_expired_posts()
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH updated AS (
    UPDATE public.posts
    SET status = 'archived', updated_at = now()
    WHERE status = 'active'
      AND expires_at IS NOT NULL
      AND expires_at <= now()
    RETURNING id
  )
  SELECT count(*)::INTEGER FROM updated;
$$;

REVOKE ALL ON FUNCTION public.archive_expired_posts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.archive_expired_posts() TO service_role;
