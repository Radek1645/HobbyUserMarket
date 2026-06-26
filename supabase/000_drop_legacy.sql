-- =============================================================================
-- Krok 1A: Odstranění legacy schématu (před nasazením PRD v3.1)
-- Spusť PRVNÍ v Supabase SQL Editoru (Dashboard → SQL → Run)
-- =============================================================================

-- Starý trigger na auth.users (vytvářel public.users)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Legacy tabulky (pořadí: závislé dříve)
DROP TABLE IF EXISTS public.offers_forum CASCADE;
DROP TABLE IF EXISTS public.listing_images CASCADE;
DROP TABLE IF EXISTS public.listings CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Legacy funkce (po DROP TABLE CASCADE může přežít, pokud byla sdílená)
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
