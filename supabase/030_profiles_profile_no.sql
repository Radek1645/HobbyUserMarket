-- =============================================================================
-- 030 — profiles.profile_no: lidsky čitelné číslo uživatele (UUID id z auth zůstává)
-- posts.id už je BIGSERIAL — nic neměnit.
-- =============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profile_no BIGINT GENERATED ALWAYS AS IDENTITY;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_profile_no_idx
  ON public.profiles (profile_no);
