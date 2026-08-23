-- Volitelný odkaz na web / sociální síť u událostí (UT-03).
-- Mimo publish-sensitive pole — změna URL neshodí inzerát na draft.

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS external_url TEXT;

COMMENT ON COLUMN public.posts.external_url IS
  'Volitelný https odkaz na web nebo sociální síť (typicky událost). NULL = nezobrazeno.';

ALTER TABLE public.posts
  DROP CONSTRAINT IF EXISTS posts_external_url_https_check;

ALTER TABLE public.posts
  ADD CONSTRAINT posts_external_url_https_check
  CHECK (
    external_url IS NULL
    OR (
      char_length(external_url) BETWEEN 12 AND 500
      AND lower(external_url) LIKE 'https://%'
    )
  );
