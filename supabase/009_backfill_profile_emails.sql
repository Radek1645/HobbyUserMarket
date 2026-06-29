-- Doplnění prázdného profiles.email z auth.users (OAuth uživatelé)
-- Spusť pokud poptávkový formulář hlásí „Kontakt zadavatele není k dispozici."

UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
  AND u.email IS NOT NULL
  AND (p.email IS NULL OR trim(p.email) = '');
