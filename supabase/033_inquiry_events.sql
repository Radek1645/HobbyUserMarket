-- =============================================================================
-- 033 — inquiry_events (H2/P15/P16/P30, PRD §11.1 C)
-- Metadata o poptávkách bez obsahu zprávy. Rate limit per IP (+ per post).
-- INSERT jen přes service_role z /api/inquiry. Bezpečně opakovatelné.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.inquiry_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id         BIGINT NOT NULL REFERENCES public.posts (id) ON DELETE CASCADE,
  viewer_user_id  UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  ip_address      TEXT NOT NULL,
  delivered       BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT inquiry_events_ip_not_empty CHECK (char_length(trim(ip_address)) > 0)
);

CREATE INDEX IF NOT EXISTS inquiry_events_ip_created_idx
  ON public.inquiry_events (ip_address, created_at DESC);

CREATE INDEX IF NOT EXISTS inquiry_events_ip_post_created_idx
  ON public.inquiry_events (ip_address, post_id, created_at DESC);

CREATE INDEX IF NOT EXISTS inquiry_events_post_created_idx
  ON public.inquiry_events (post_id, created_at DESC)
  WHERE delivered = true;

ALTER TABLE public.inquiry_events ENABLE ROW LEVEL SECURITY;

-- Moderátor / admin — God Mode timeline (PRD §11.1 C).
DROP POLICY IF EXISTS inquiry_events_select_moderator ON public.inquiry_events;
CREATE POLICY inquiry_events_select_moderator ON public.inquiry_events
  FOR SELECT TO authenticated
  USING (public.is_moderator_or_admin());

-- Majitel inzerátu — agregáty (počet poptávek), bez PII odesílatele.
DROP POLICY IF EXISTS inquiry_events_select_post_owner ON public.inquiry_events;
CREATE POLICY inquiry_events_select_post_owner ON public.inquiry_events
  FOR SELECT TO authenticated
  USING (
    delivered = true
    AND EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = inquiry_events.post_id
        AND p.user_id = auth.uid()
    )
  );

GRANT SELECT ON public.inquiry_events TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.inquiry_events TO service_role;
