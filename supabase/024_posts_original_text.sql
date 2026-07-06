-- Původní znění inzerátu před AI úpravou (pro metriku využití AI vylepšení).
-- Finální text zůstává v title / description.

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS original_title TEXT,
  ADD COLUMN IF NOT EXISTS original_description TEXT;

ALTER TABLE public.posts
  DROP CONSTRAINT IF EXISTS posts_original_title_length_check;

ALTER TABLE public.posts
  ADD CONSTRAINT posts_original_title_length_check
    CHECK (original_title IS NULL OR char_length(original_title) BETWEEN 1 AND 80);

ALTER TABLE public.posts
  DROP CONSTRAINT IF EXISTS posts_original_description_length_check;

ALTER TABLE public.posts
  ADD CONSTRAINT posts_original_description_length_check
    CHECK (original_description IS NULL OR char_length(original_description) <= 2000);
