-- =============================================================================
-- 050 — Anonymizace IP v inquiry_events po N dnech (GDPR §3.2)
-- IPv4: poslední oktet → 0. IPv6 / ostatní → 'anonymized'.
-- Idempotentní: přeskočí už zkrácené / anonymizované řádky.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.anonymize_old_inquiry_ips(
  p_after_days INTEGER DEFAULT 7
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  IF p_after_days IS NULL OR p_after_days < 1 THEN
    RAISE EXCEPTION 'p_after_days must be >= 1';
  END IF;

  WITH candidates AS (
    SELECT id, ip_address
    FROM public.inquiry_events
    WHERE created_at < now() - make_interval(days => p_after_days)
      AND ip_address IS NOT NULL
      AND trim(ip_address) <> ''
      AND ip_address <> 'anonymized'
      AND ip_address !~ '^[0-9]{1,3}(\.[0-9]{1,3}){2}\.0$'
  ),
  transformed AS (
    SELECT
      id,
      CASE
        WHEN ip_address ~ '^[0-9]{1,3}(\.[0-9]{1,3}){3}$' THEN
          regexp_replace(ip_address, '\.[0-9]{1,3}$', '.0')
        ELSE
          'anonymized'
      END AS new_ip
    FROM candidates
  ),
  updated AS (
    UPDATE public.inquiry_events e
    SET ip_address = t.new_ip
    FROM transformed t
    WHERE e.id = t.id
      AND e.ip_address IS DISTINCT FROM t.new_ip
    RETURNING e.id
  )
  SELECT count(*)::INTEGER INTO v_updated FROM updated;

  RETURN coalesce(v_updated, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.anonymize_old_inquiry_ips(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.anonymize_old_inquiry_ips(INTEGER) TO service_role;

COMMENT ON FUNCTION public.anonymize_old_inquiry_ips(INTEGER) IS
  'Zkrátí IP v inquiry_events starších než p_after_days (IPv4 → x.x.x.0, jinak anonymized).';
