-- =============================================================================
-- 073 — Anonymous AI rate limits (guest listing draft / FB funnel C)
--
-- Guest preview nesmí spotřebovávat user-keyed rate_limits. Atomický RPC
-- (service_role only) — stejný fail-closed vzor jako SEC-H03 / 062.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.anonymous_rate_limits (
  subject_key   TEXT NOT NULL,
  action_type   TEXT NOT NULL,
  window_start  TIMESTAMPTZ NOT NULL,
  count         INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (subject_key, action_type, window_start)
);

CREATE INDEX IF NOT EXISTS anonymous_rate_limits_window_idx
  ON public.anonymous_rate_limits (window_start);

ALTER TABLE public.anonymous_rate_limits ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.anonymous_rate_limits FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.anonymous_rate_limits TO service_role;

CREATE OR REPLACE FUNCTION public.increment_anonymous_rate_limit(
  p_subject_key  TEXT,
  p_action_type  TEXT,
  p_window_start TIMESTAMPTZ
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  IF p_subject_key IS NULL OR length(trim(p_subject_key)) < 8 THEN
    RAISE EXCEPTION 'invalid_subject_key' USING errcode = '22023';
  END IF;

  INSERT INTO public.anonymous_rate_limits (
    subject_key,
    action_type,
    window_start,
    count
  )
  VALUES (
    trim(p_subject_key),
    trim(p_action_type),
    p_window_start,
    1
  )
  ON CONFLICT (subject_key, action_type, window_start)
  DO UPDATE SET count = public.anonymous_rate_limits.count + 1
  RETURNING count INTO v_count;

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_anonymous_rate_limit(TEXT, TEXT, TIMESTAMPTZ)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_anonymous_rate_limit(TEXT, TEXT, TIMESTAMPTZ)
  TO service_role;

-- Atomický pár IP + visitor. Peek a inkrement probíhají pod row lockem,
-- takže paralelní requesty nepřekročí hard limit ani neobejdou captcha práh.
CREATE OR REPLACE FUNCTION public.consume_anonymous_rate_limit_pair(
  p_ip_key            TEXT,
  p_visitor_key       TEXT,
  p_action_type       TEXT,
  p_window_start      TIMESTAMPTZ,
  p_soft_limit        INTEGER,
  p_ip_hard_limit     INTEGER,
  p_visitor_hard_limit INTEGER,
  p_captcha_verified  BOOLEAN DEFAULT false
)
RETURNS TABLE (
  ip_count          INTEGER,
  visitor_count     INTEGER,
  requires_captcha  BOOLEAN,
  allowed           BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ip_count INTEGER;
  v_visitor_count INTEGER;
  v_requires_captcha BOOLEAN;
BEGIN
  IF
    p_ip_key IS NULL OR length(trim(p_ip_key)) < 8
    OR p_visitor_key IS NULL OR length(trim(p_visitor_key)) < 8
    OR p_ip_key = p_visitor_key
    OR p_soft_limit < 0
    OR p_ip_hard_limit < 1
    OR p_visitor_hard_limit < 1
    OR p_soft_limit > LEAST(p_ip_hard_limit, p_visitor_hard_limit)
  THEN
    RAISE EXCEPTION 'invalid_rate_limit_input' USING errcode = '22023';
  END IF;

  INSERT INTO public.anonymous_rate_limits (
    subject_key,
    action_type,
    window_start,
    count
  )
  VALUES
    (trim(p_ip_key), trim(p_action_type), p_window_start, 0),
    (trim(p_visitor_key), trim(p_action_type), p_window_start, 0)
  ON CONFLICT (subject_key, action_type, window_start) DO NOTHING;

  -- Stabilní pořadí zámků brání deadlocku mezi paralelními requesty.
  PERFORM 1
  FROM public.anonymous_rate_limits
  WHERE subject_key IN (trim(p_ip_key), trim(p_visitor_key))
    AND action_type = trim(p_action_type)
    AND window_start = p_window_start
  ORDER BY subject_key
  FOR UPDATE;

  SELECT count INTO v_ip_count
  FROM public.anonymous_rate_limits
  WHERE subject_key = trim(p_ip_key)
    AND action_type = trim(p_action_type)
    AND window_start = p_window_start;

  SELECT count INTO v_visitor_count
  FROM public.anonymous_rate_limits
  WHERE subject_key = trim(p_visitor_key)
    AND action_type = trim(p_action_type)
    AND window_start = p_window_start;

  v_requires_captcha :=
    v_ip_count >= p_soft_limit OR v_visitor_count >= p_soft_limit;

  IF
    v_ip_count >= p_ip_hard_limit
    OR v_visitor_count >= p_visitor_hard_limit
  THEN
    RETURN QUERY SELECT
      v_ip_count,
      v_visitor_count,
      v_requires_captcha,
      false;
    RETURN;
  END IF;

  IF v_requires_captcha AND NOT p_captcha_verified THEN
    RETURN QUERY SELECT
      v_ip_count,
      v_visitor_count,
      true,
      false;
    RETURN;
  END IF;

  UPDATE public.anonymous_rate_limits
  SET count = count + 1
  WHERE subject_key IN (trim(p_ip_key), trim(p_visitor_key))
    AND action_type = trim(p_action_type)
    AND window_start = p_window_start;

  RETURN QUERY SELECT
    v_ip_count + 1,
    v_visitor_count + 1,
    v_requires_captcha,
    true;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_anonymous_rate_limit_pair(
  TEXT,
  TEXT,
  TEXT,
  TIMESTAMPTZ,
  INTEGER,
  INTEGER,
  INTEGER,
  BOOLEAN
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_anonymous_rate_limit_pair(
  TEXT,
  TEXT,
  TEXT,
  TIMESTAMPTZ,
  INTEGER,
  INTEGER,
  INTEGER,
  BOOLEAN
) TO service_role;

-- Idempotence guest resume/publish. Jeden request ID může pro uživatele
-- vytvořit nejvýše jeden posts řádek; started_at funguje jako krátký mutex.
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS publish_request_id UUID,
  ADD COLUMN IF NOT EXISTS publish_started_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS posts_user_publish_request_unique_idx
  ON public.posts (user_id, publish_request_id)
  WHERE publish_request_id IS NOT NULL;
