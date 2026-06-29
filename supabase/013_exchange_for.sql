-- Volitelný popis požadované výměny u price_type = 'exchange'

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS exchange_for VARCHAR(100);

ALTER TABLE public.posts
  DROP CONSTRAINT IF EXISTS posts_exchange_for_check;

ALTER TABLE public.posts
  ADD CONSTRAINT posts_exchange_for_check
  CHECK (
    (
      price_type = 'exchange'
      AND (
        exchange_for IS NULL
        OR char_length(trim(exchange_for)) BETWEEN 1 AND 100
      )
    )
    OR (price_type <> 'exchange' AND exchange_for IS NULL)
  );
