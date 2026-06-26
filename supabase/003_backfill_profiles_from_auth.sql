-- Jednorázový backfill: vytvoří profiles pro existující auth.users (po resetu DB)
-- Spusť v Supabase SQL Editoru, pokud se přihlásíš a profil v profiles chybí.

INSERT INTO public.profiles (id, nickname, email, name, avatar_url, role)
SELECT
  u.id,
  'user_' || substr(replace(u.id::text, '-', ''), 1, 12),
  u.email,
  COALESCE(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name'),
  COALESCE(u.raw_user_meta_data ->> 'avatar_url', u.raw_user_meta_data ->> 'picture'),
  'user'::public.user_role
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);
