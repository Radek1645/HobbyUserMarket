-- GRANTy pro service_role (poptávkový formulář — lookup e-mailu zadavatele)
-- Service role obvykle RLS obchází, explicitní GRANT pomáhá při permission denied.

GRANT SELECT ON public.posts TO service_role;
GRANT SELECT ON public.profiles TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.rate_limits TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.inquiry_events TO service_role;
