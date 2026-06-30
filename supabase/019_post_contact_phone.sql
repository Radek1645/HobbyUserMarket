-- Telefon pro přímý kontakt u konkrétního inzerátu (ne v profilu uživatele).

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS contact_phone TEXT;

ALTER TABLE public.posts
  DROP CONSTRAINT IF EXISTS posts_contact_phone_check;

ALTER TABLE public.posts
  ADD CONSTRAINT posts_contact_phone_check
  CHECK (
    contact_phone IS NULL
    OR (
      char_length(trim(contact_phone)) >= 9
      AND char_length(trim(contact_phone)) <= 30
    )
  );
