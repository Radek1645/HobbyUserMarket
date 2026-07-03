-- Server-side strip kontaktů v popisu/titulku — PRD §5.4 pojistka proti obejití Server Action / Edge Function.
-- Platí na INSERT i UPDATE (včetně „Ignorovat AI“ a přímého Supabase SDK).

CREATE OR REPLACE FUNCTION public.strip_contact_info(input_text text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT regexp_replace(
    regexp_replace(
      COALESCE(input_text, ''),
      '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}',
      '[SKRYTO – použij chráněné pole]',
      'gi'
    ),
    '(\+?\d{1,3}[\s.-]?)?([\d][\d\s.-]{7,12}[\d])',
    '[SKRYTO – použij chráněné pole]',
    'g'
  );
$$;

CREATE OR REPLACE FUNCTION public.posts_strip_contacts_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.title IS NOT NULL THEN
    NEW.title := public.strip_contact_info(NEW.title);
  END IF;

  IF NEW.description IS NOT NULL THEN
    NEW.description := public.strip_contact_info(NEW.description);
  END IF;

  IF NEW.exchange_for IS NOT NULL THEN
    NEW.exchange_for := public.strip_contact_info(NEW.exchange_for);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_posts_strip_contacts ON public.posts;

CREATE TRIGGER trg_posts_strip_contacts
  BEFORE INSERT OR UPDATE OF title, description, exchange_for
  ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.posts_strip_contacts_trigger();
