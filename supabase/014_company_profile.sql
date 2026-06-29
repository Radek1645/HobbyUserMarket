-- Firemní profil + veřejné zobrazení zadavatele u inzerátu

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_company BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS company_name VARCHAR(150),
  ADD COLUMN IF NOT EXISTS company_ico VARCHAR(8),
  ADD COLUMN IF NOT EXISTS company_ico_verified BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_company_fields_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_company_fields_check
  CHECK (
    (
      is_company = false
      AND company_name IS NULL
      AND company_ico IS NULL
    )
    OR (
      is_company = true
      AND company_name IS NOT NULL
      AND char_length(trim(company_name)) BETWEEN 2 AND 150
    )
  );

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_company_ico_format_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_company_ico_format_check
  CHECK (company_ico IS NULL OR company_ico ~ '^\d{8}$');

-- Veřejná data zadavatele (bez e-mailu) pro detail inzerátu
CREATE OR REPLACE FUNCTION public.get_advertiser_display(p_user_id UUID)
RETURNS TABLE (
  nickname VARCHAR(50),
  is_company BOOLEAN,
  company_name VARCHAR(150),
  company_ico VARCHAR(8)
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.nickname, p.is_company, p.company_name, p.company_ico
  FROM public.profiles p
  WHERE p.id = p_user_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_advertiser_display(UUID) TO anon, authenticated;
