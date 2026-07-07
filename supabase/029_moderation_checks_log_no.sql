-- =============================================================================
-- 029 — přechod ze staré 028 (UUID sloupec id) na log_no
-- Pouze pokud tabulka existuje, nemá log_no a je prázdná. Jinak migruj ručně.
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'moderation_checks'
  ) THEN
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'moderation_checks'
      AND column_name = 'log_no'
  ) THEN
    RETURN;
  END IF;

  IF EXISTS (SELECT 1 FROM public.moderation_checks LIMIT 1) THEN
    RAISE EXCEPTION
      'moderation_checks už obsahuje data se starým schématem — migruj log_no ručně nebo zálohuj a DROP TABLE';
  END IF;

  DROP TABLE public.moderation_checks;
END $$;

-- Po 029 spusť znovu 028_moderation_checks.sql
