-- SEO fields for listing meta description and main image alt (SEO Bible v1.0).
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS meta_description TEXT,
  ADD COLUMN IF NOT EXISTS image_alt TEXT;

ALTER TABLE public.posts
  DROP CONSTRAINT IF EXISTS posts_meta_description_length_check;

ALTER TABLE public.posts
  ADD CONSTRAINT posts_meta_description_length_check
  CHECK (
    meta_description IS NULL
    OR char_length(meta_description) BETWEEN 1 AND 160
  );

ALTER TABLE public.posts
  DROP CONSTRAINT IF EXISTS posts_image_alt_length_check;

ALTER TABLE public.posts
  ADD CONSTRAINT posts_image_alt_length_check
  CHECK (
    image_alt IS NULL
    OR char_length(image_alt) BETWEEN 1 AND 125
  );

COMMENT ON COLUMN public.posts.meta_description IS
  'AI SEO meta description (150–160 chars). Null = fallback from description intro.';
COMMENT ON COLUMN public.posts.image_alt IS
  'AI alt text for main listing image. Null = fallback to title.';
