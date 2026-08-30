-- =============================================================================
-- 080 — Události mizí o půlnoci v den konání (Europe/Prague)
-- Dřív: expires_at = event_date + 24 h (akce 29. 8. 10:00 visela do 30. 8. 10:00).
-- Teď: půlnoc následujícího kalendářního dne v Praze (29. 8. 10:00 → 30. 8. 00:00 CEST).
-- Veřejná viditelnost: is_post_publicly_visible vyžaduje expires_at > now().
-- =============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.event_listing_expires_at(p_event_date TIMESTAMPTZ)
RETURNS TIMESTAMPTZ
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT
    (date_trunc('day', p_event_date AT TIME ZONE 'Europe/Prague')
      + INTERVAL '1 day')
    AT TIME ZONE 'Europe/Prague';
$$;

COMMENT ON FUNCTION public.event_listing_expires_at(TIMESTAMPTZ) IS
  'Půlnoc Europe/Prague následujícího kalendářního dne po dni konání.';

REVOKE ALL ON FUNCTION public.event_listing_expires_at(TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.event_listing_expires_at(TIMESTAMPTZ)
  TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.handle_post_expiration_logic()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_created TIMESTAMPTZ;
  v_hard_cap TIMESTAMPTZ;
BEGIN
  v_created := COALESCE(NEW.created_at, now());
  v_hard_cap := public.listing_lifetime_hard_cap(v_created);

  IF NEW.category_type = 'udalost' THEN
    IF NEW.event_date IS NULL THEN
      RAISE EXCEPTION 'U kategorie udalost je pole event_date povinne.';
    END IF;
    NEW.expires_at := public.event_listing_expires_at(NEW.event_date);
  ELSE
    NEW.event_date := NULL;
    IF NEW.listing_duration_days IS NULL THEN
      NEW.listing_duration_days := 30;
    END IF;
    NEW.expires_at := now() + (NEW.listing_duration_days || ' days')::interval;
  END IF;

  IF NEW.expires_at IS NOT NULL AND NEW.expires_at > v_hard_cap THEN
    NEW.expires_at := v_hard_cap;
  END IF;

  RETURN NEW;
END;
$$;

-- Existující události: přepočet expires_at (SQL editor / migrace běží privileged).
UPDATE public.posts
SET expires_at = LEAST(
  public.event_listing_expires_at(event_date),
  public.listing_lifetime_hard_cap(created_at)
)
WHERE category_type = 'udalost'
  AND event_date IS NOT NULL
  AND expires_at IS DISTINCT FROM LEAST(
    public.event_listing_expires_at(event_date),
    public.listing_lifetime_hard_cap(created_at)
  );

COMMIT;
