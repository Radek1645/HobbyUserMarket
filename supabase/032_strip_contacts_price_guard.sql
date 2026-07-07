-- =============================================================================
-- 032 — strip_contact_info: nezaměňovat formátovanou cenu za telefon
-- Regex z 020 chybně chytal „1 536 380“ v „Cena 1 536 380 Kč“.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.strip_contact_info(input_text text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
PARALLEL SAFE
AS $$
DECLARE
  result text := COALESCE(input_text, '');
  protected text[] := ARRAY[]::text[];
  match_text text;
  idx int := 0;
  i int;
  escaped text;
BEGIN
  -- Maskuj fráze s cenou před strip telefonů
  LOOP
    SELECT (m)[1]
    INTO match_text
    FROM regexp_matches(
      result,
      '((?:[Cc]ena|[Oo]rientační cena|[Mm]zda|[Vv]stupné)\s+\d[\d\s]{0,15}\d\s*Kč\.?)',
      'i'
    ) AS m
    LIMIT 1;

    EXIT WHEN match_text IS NULL;

    protected := array_append(protected, match_text);
    escaped := regexp_replace(match_text, '([\[\].*^$+?{}|()\\])', '\\\1', 'g');
    result := regexp_replace(result, escaped, '@@PRICE' || idx || '@@', 1);
    idx := idx + 1;
  END LOOP;

  result := regexp_replace(
    result,
    '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}',
    '[SKRYTO – použij chráněné pole]',
    'gi'
  );

  -- Český telefon (mobil 6xx/7xx, pevná 2xx–5xx), ne formátovaná částka
  result := regexp_replace(
    result,
    '(?:\+420[\s.-]?)?(?:[67]\d{2}|[2-5]\d{2})[\s.-]?\d{3}[\s.-]?\d{3}\y',
    '[SKRYTO – použij chráněné pole]',
    'g'
  );

  IF array_length(protected, 1) IS NOT NULL THEN
    FOR i IN 1..array_length(protected, 1) LOOP
      result := replace(result, '@@PRICE' || (i - 1) || '@@', protected[i]);
    END LOOP;
  END IF;

  RETURN result;
END;
$$;
