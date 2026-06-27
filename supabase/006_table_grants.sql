-- Oprávnění tabulek pro Supabase role (RLS samo o sobě nestačí)
-- Chyba bez tohoto: permission denied for table posts (42501)

GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- posts — založení a čtení inzerátů
GRANT SELECT ON public.posts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.posts_id_seq TO authenticated;

-- profiles — profil přihlášeného uživatele
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.profiles TO authenticated;

-- související tabulky (MVP + blízká budoucnost)
GRANT SELECT ON public.post_images TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.post_images TO authenticated;

GRANT SELECT ON public.comments TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.comments TO authenticated;

GRANT SELECT, INSERT ON public.reports TO authenticated;
GRANT SELECT, INSERT ON public.contact_reveals TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.rate_limits TO authenticated;
