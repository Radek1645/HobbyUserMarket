-- Edge Function moderate-listing používá service_role pro rate_limits (ai_check).
-- Bez GRANTu: permission denied for table rate_limits (42501).

GRANT SELECT, INSERT, UPDATE ON public.rate_limits TO service_role;
