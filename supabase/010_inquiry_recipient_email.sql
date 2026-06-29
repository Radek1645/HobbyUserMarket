-- E-mail zadavatele pro poptávkový formulář (SECURITY DEFINER, čte auth.users)
-- Volá pouze service_role z API route.

CREATE OR REPLACE FUNCTION public.get_inquiry_recipient_email(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_email TEXT;
BEGIN
  SELECT NULLIF(trim(p.email), '')
  INTO v_email
  FROM public.profiles p
  WHERE p.id = p_user_id;

  IF v_email IS NOT NULL THEN
    RETURN v_email;
  END IF;

  SELECT u.email
  INTO v_email
  FROM auth.users u
  WHERE u.id = p_user_id;

  RETURN NULLIF(trim(v_email), '');
END;
$$;

REVOKE ALL ON FUNCTION public.get_inquiry_recipient_email(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_inquiry_recipient_email(UUID) TO service_role;
