-- HobbyUserMarket — databázové schéma pro Supabase SQL Editor
-- Spusť celý skript najednou v: Dashboard → SQL → New query → Run

-- =============================================================================
-- Extensions
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS postgis;

-- =============================================================================
-- public.users (1:1 s auth.users)
-- =============================================================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- Trigger: automatické vytvoření profilu po registraci
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data ->> 'full_name',
      NEW.raw_user_meta_data ->> 'name'
    ),
    COALESCE(
      NEW.raw_user_meta_data ->> 'avatar_url',
      NEW.raw_user_meta_data ->> 'picture'
    )
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- categories
-- =============================================================================
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT
);

INSERT INTO public.categories (name, slug, icon) VALUES
  ('Potraviny', 'potraviny', 'shopping-basket'),
  ('Služby', 'sluzby', 'wrench'),
  ('Řemeslo', 'remeslo', 'hammer');

-- =============================================================================
-- listings (inzeráty)
-- =============================================================================
CREATE TABLE public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC(12, 2),
  category_id UUID REFERENCES public.categories (id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending_review'
    CHECK (status IN ('active', 'pending_review', 'archived')),
  location GEOMETRY(Point, 4326),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX listings_location_idx ON public.listings USING GIST (location);
CREATE INDEX listings_user_id_idx ON public.listings (user_id);
CREATE INDEX listings_category_id_idx ON public.listings (category_id);
CREATE INDEX listings_status_idx ON public.listings (status);

-- =============================================================================
-- listing_images
-- =============================================================================
CREATE TABLE public.listing_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings (id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_main BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX listing_images_listing_id_idx ON public.listing_images (listing_id);

-- =============================================================================
-- offers_forum (nabídky / diskuze k inzerátu)
-- =============================================================================
CREATE TABLE public.offers_forum (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  proposed_price NUMERIC(12, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX offers_forum_listing_id_idx ON public.offers_forum (listing_id);
CREATE INDEX offers_forum_user_id_idx ON public.offers_forum (user_id);

-- =============================================================================
-- Row Level Security
-- =============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers_forum ENABLE ROW LEVEL SECURITY;

-- users: každý vidí všechny profily, upravovat může jen vlastní
CREATE POLICY "Users are viewable by everyone"
  ON public.users FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- categories: veřejné čtení
CREATE POLICY "Categories are viewable by everyone"
  ON public.categories FOR SELECT
  USING (true);

-- listings: aktivní inzeráty vidí všichni, vlastní spravuje autor
CREATE POLICY "Active listings are viewable by everyone"
  ON public.listings FOR SELECT
  USING (status = 'active' OR auth.uid() = user_id);

CREATE POLICY "Users can insert own listings"
  ON public.listings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own listings"
  ON public.listings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own listings"
  ON public.listings FOR DELETE
  USING (auth.uid() = user_id);

-- listing_images: viditelné pokud je viditelný inzerát
CREATE POLICY "Listing images follow listing visibility"
  ON public.listing_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_id
        AND (l.status = 'active' OR l.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage images on own listings"
  ON public.listing_images FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_id AND l.user_id = auth.uid()
    )
  );

-- offers_forum: čtení u aktivních inzerátů, psát může přihlášený uživatel
CREATE POLICY "Offers visible for accessible listings"
  ON public.offers_forum FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_id
        AND (l.status = 'active' OR l.user_id = auth.uid())
    )
  );

CREATE POLICY "Authenticated users can post offers"
  ON public.offers_forum FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own offers"
  ON public.offers_forum FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own offers"
  ON public.offers_forum FOR DELETE
  USING (auth.uid() = user_id);
