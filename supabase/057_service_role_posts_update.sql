-- =============================================================================
-- 057 — service_role: UPDATE na posts (hard stop hide/restore + cron)
-- =============================================================================
-- 008 dal jen SELECT; 052 jen UPDATE (view_count). Hide při blacklistu
-- (status / status_reason_code) končil 42501 permission denied.
-- =============================================================================

GRANT SELECT, UPDATE ON public.posts TO service_role;
