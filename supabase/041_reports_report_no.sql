-- =============================================================================
-- 041 — report_no: lidsky čitelné číslo řádku (vzor inquiry_events.inquiry_no)
-- UUID id zůstává PK. Existujícím řádkům se přiřadí 1, 2, 3…
-- =============================================================================

ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS report_no BIGINT GENERATED ALWAYS AS IDENTITY;

CREATE UNIQUE INDEX IF NOT EXISTS reports_report_no_idx
  ON public.reports (report_no);
