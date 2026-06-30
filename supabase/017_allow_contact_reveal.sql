-- Volba zadavatele: které přímé kanály (e-mail / telefon) umožnit po kliknutí na detailu.
-- Poptávkový formulář je vždy — neukládá se do DB.

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS show_contact_email BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS show_contact_phone BOOLEAN NOT NULL DEFAULT false;

-- Migrace ze starší verze 017 (allow_contact_reveal) — sloupec jen smažeme.
-- Starý DEFAULT true se NEPŘENÁŠÍ: opt-in musí být explicitní ve formuláři.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'posts'
      AND column_name = 'allow_contact_reveal'
  ) THEN
    ALTER TABLE public.posts DROP COLUMN allow_contact_reveal;
  END IF;
END $$;
