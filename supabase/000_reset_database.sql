-- =============================================================================
-- RESET: Kompletní vyčištění public schématu + auth triggery
-- Spusť PRVNÍ v Supabase SQL Editoru (Ctrl+A → Run)
-- Poté spusť celý supabase_schema.sql
-- =============================================================================

-- 1. Auth triggery (mimo public schema)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS trg_prevent_email_change ON auth.users;

-- 2. Storage politiky pro post-images (tabulky v public se smažou níže)
DROP POLICY IF EXISTS post_images_storage_select ON storage.objects;
DROP POLICY IF EXISTS post_images_storage_insert ON storage.objects;
DROP POLICY IF EXISTS post_images_storage_update ON storage.objects;
DROP POLICY IF EXISTS post_images_storage_delete ON storage.objects;

-- 3. Smazat celé public schema včetně tabulek, funkcí, typů, RLS
DROP SCHEMA IF EXISTS public CASCADE;

-- 4. Obnovit public schema a oprávnění (Supabase standard)
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO anon;
GRANT ALL ON SCHEMA public TO authenticated;
GRANT ALL ON SCHEMA public TO service_role;

COMMENT ON SCHEMA public IS 'standard public schema';

-- 5. Volitelně: smazat soubory v bucketu (odkomentuj pokud chceš i storage vyčistit)
-- DELETE FROM storage.objects WHERE bucket_id = 'post-images';
-- DELETE FROM storage.buckets WHERE id = 'post-images';
