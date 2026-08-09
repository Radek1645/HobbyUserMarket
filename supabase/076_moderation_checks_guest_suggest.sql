-- =============================================================================
-- 076 — moderation_checks: guest actor + logování suggest-from-photos
-- Prefill (včetně anonymního) musí umět uložit Sightengine JSON.
-- =============================================================================

ALTER TABLE public.moderation_checks
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.moderation_checks
  ADD COLUMN IF NOT EXISTS guest_visitor_id UUID;

COMMENT ON COLUMN public.moderation_checks.guest_visitor_id IS
  'Návštěvnická relace u guest flow (intent suggest_from_photos / preview); bez auth.users.';

ALTER TABLE public.moderation_checks
  DROP CONSTRAINT IF EXISTS moderation_checks_actor_check;

ALTER TABLE public.moderation_checks
  ADD CONSTRAINT moderation_checks_actor_check
  CHECK (user_id IS NOT NULL OR guest_visitor_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS moderation_checks_guest_visitor_idx
  ON public.moderation_checks (guest_visitor_id, created_at DESC)
  WHERE guest_visitor_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS moderation_checks_intent_idx
  ON public.moderation_checks (intent, created_at DESC)
  WHERE intent IS NOT NULL;
