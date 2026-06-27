-- HobbyUserMarket — PRD v3.7 migration (v0.1.1 platnost + v0.2 události)
-- Spusť v Supabase SQL Editoru na DB nasazené z v3.1.
-- expires_at, renew_count, payment_status už ve v3.1 existují — nepřidáváme znovu.

-- §9: volitelná platnost (default 30 dní)
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS listing_duration_days INTEGER NOT NULL DEFAULT 30;

ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_listing_duration_days_check;
ALTER TABLE public.posts ADD CONSTRAINT posts_listing_duration_days_check
  CHECK (listing_duration_days BETWEEN 1 AND 365);

-- §8: události
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS event_date TIMESTAMPTZ NULL;

ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_category_type_check;
ALTER TABLE public.posts ADD CONSTRAINT posts_category_type_check
  CHECK (category_type IN ('zbozi', 'sluzby', 'udalost'));

ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_condition_matches_category_check;
ALTER TABLE public.posts ADD CONSTRAINT posts_condition_matches_category_check
  CHECK (
    (category_type = 'zbozi' AND condition_label IN ('new', 'like_new', 'used'))
    OR (category_type = 'sluzby' AND condition_label IN ('one_time', 'long_term', 'substitute'))
    OR (category_type = 'udalost' AND condition_label = 'one_time')
  );

ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_event_date_by_category_check;
ALTER TABLE public.posts ADD CONSTRAINT posts_event_date_by_category_check
  CHECK (
    (category_type = 'udalost' AND event_date IS NOT NULL)
    OR (category_type <> 'udalost' AND event_date IS NULL)
  );

CREATE INDEX IF NOT EXISTS posts_event_date_idx
  ON public.posts (event_date)
  WHERE category_type = 'udalost' AND status = 'active';

-- Trigger: expires_at vždy z DB (frontend neposílá)
CREATE OR REPLACE FUNCTION public.handle_post_expiration_logic()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.category_type = 'udalost' THEN
    IF NEW.event_date IS NULL THEN
      RAISE EXCEPTION 'U kategorie udalost je pole event_date povinne.';
    END IF;
    NEW.expires_at := NEW.event_date + INTERVAL '1 day';
  ELSE
    NEW.event_date := NULL;
    IF NEW.listing_duration_days IS NULL THEN
      NEW.listing_duration_days := 30;
    END IF;
    NEW.expires_at := now() + (NEW.listing_duration_days || ' days')::interval;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_post_expiration_logic ON public.posts;
CREATE TRIGGER trigger_post_expiration_logic
  BEFORE INSERT OR UPDATE OF category_type, event_date, listing_duration_days
  ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_post_expiration_logic();

-- Backfill: existující inzeráty bez expires_at — trigger přepočítá z listing_duration_days
UPDATE public.posts
SET listing_duration_days = listing_duration_days
WHERE category_type IN ('zbozi', 'sluzby')
  AND expires_at IS NULL;
