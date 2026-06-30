-- Jednorázově po nasazení opt-in modelu kontaktu.
-- Opraví staré inzeráty, kterým migrace allow_contact_reveal (DEFAULT true)
-- omylem zapnula show_contact_email.
--
-- Spusť jednou v Supabase SQL Editoru. Nové inzeráty s explicitní volbou ve
-- formuláři už ukládají správné hodnoty — tento skript je pro existující data.

UPDATE public.posts
SET
  show_contact_email = false,
  show_contact_phone = false;
