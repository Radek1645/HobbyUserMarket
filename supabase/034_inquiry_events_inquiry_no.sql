-- =============================================================================
-- 034 — inquiry_no: lidsky čitelné číslo řádku (vzor moderation_checks.log_no)
-- UUID id zůstává PK. Existujícím řádkům se přiřadí 1, 2, 3…
-- =============================================================================

ALTER TABLE public.inquiry_events
  ADD COLUMN IF NOT EXISTS inquiry_no BIGINT GENERATED ALWAYS AS IDENTITY;

CREATE UNIQUE INDEX IF NOT EXISTS inquiry_events_inquiry_no_idx
  ON public.inquiry_events (inquiry_no);
