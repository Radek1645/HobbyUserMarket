-- Popis inzerátu: 1200 → 2000 znaků (drž v sync s LISTING_DESCRIPTION_MAX_LENGTH v src/config/app.ts)

ALTER TABLE public.posts
  DROP CONSTRAINT IF EXISTS posts_description_length_check;

ALTER TABLE public.posts
  ADD CONSTRAINT posts_description_length_check
    CHECK (char_length(description) <= 2000);
