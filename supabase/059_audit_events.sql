-- =============================================================================
-- 059 — Systémový audit lifecycle inzerátu (PRD §11.1 A)
-- Append-only historie změn stavu / prodloužení / nahlášení.
-- Engagement (contact_reveals, inquiry_events) zůstává odděleně.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.audit_events (
  event_no       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  entity_type    TEXT NOT NULL,
  entity_id      TEXT NOT NULL,
  event_type     TEXT NOT NULL,
  actor_user_id  UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  actor_role     TEXT,
  payload        JSONB NOT NULL DEFAULT '{}'::jsonb,

  CONSTRAINT audit_events_entity_type_check
    CHECK (entity_type IN ('post', 'profile')),
  CONSTRAINT audit_events_entity_id_not_empty
    CHECK (char_length(trim(entity_id)) > 0),
  CONSTRAINT audit_events_event_type_not_empty
    CHECK (char_length(trim(event_type)) > 0)
);

CREATE INDEX IF NOT EXISTS audit_events_entity_idx
  ON public.audit_events (entity_type, entity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS audit_events_created_at_idx
  ON public.audit_events (created_at DESC);

CREATE INDEX IF NOT EXISTS audit_events_event_type_idx
  ON public.audit_events (event_type, created_at DESC);

COMMENT ON TABLE public.audit_events IS
  'Append-only audit lifecycle (stav inzerátu, renew, report). Ne engagement.';

ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS audit_events_select_moderator ON public.audit_events;
CREATE POLICY audit_events_select_moderator ON public.audit_events
  FOR SELECT TO authenticated
  USING (public.is_moderator_or_admin());

-- Append-only: žádný UPDATE/DELETE pro role aplikace.
REVOKE INSERT, UPDATE, DELETE ON public.audit_events FROM PUBLIC;
REVOKE INSERT, UPDATE, DELETE ON public.audit_events FROM anon, authenticated;
GRANT SELECT ON public.audit_events TO authenticated;
GRANT SELECT, INSERT ON public.audit_events TO service_role;

-- Volitelný kontext z Server Action (důvod moderace) — transaction-local.
CREATE OR REPLACE FUNCTION public.set_audit_context(p_payload jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  PERFORM set_config(
    'app.audit_context',
    coalesce(p_payload, '{}'::jsonb)::text,
    true
  );
END;
$$;

REVOKE ALL ON FUNCTION public.set_audit_context(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_audit_context(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_audit_context(jsonb) TO service_role;

CREATE OR REPLACE FUNCTION public.insert_audit_event(
  p_entity_type text,
  p_entity_id text,
  p_event_type text,
  p_actor_user_id uuid,
  p_actor_role text,
  p_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_events (
    entity_type,
    entity_id,
    event_type,
    actor_user_id,
    actor_role,
    payload
  ) VALUES (
    p_entity_type,
    p_entity_id,
    p_event_type,
    p_actor_user_id,
    p_actor_role,
    coalesce(p_payload, '{}'::jsonb)
  );
END;
$$;

-- Volá SECURITY DEFINER trigger při UPDATE posts (authenticated / service_role).
REVOKE ALL ON FUNCTION public.insert_audit_event(text, text, text, uuid, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.insert_audit_event(text, text, text, uuid, text, jsonb)
  TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.resolve_audit_actor_role(p_post_owner_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_role text;
BEGIN
  IF v_uid IS NULL THEN
    RETURN 'system';
  END IF;

  SELECT role INTO v_role
  FROM public.profiles
  WHERE id = v_uid;

  IF v_role IN ('admin', 'moderator') THEN
    RETURN v_role;
  END IF;

  IF p_post_owner_id IS NOT NULL AND v_uid = p_post_owner_id THEN
    RETURN 'owner';
  END IF;

  RETURN coalesce(v_role, 'user');
END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_post_audit_event_type(
  p_from_status text,
  p_to_status text,
  p_reason_code text,
  p_actor_role text
)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF p_to_status = 'deleted' THEN
    IF p_actor_role IN ('moderator', 'admin') THEN
      RETURN 'post_deleted_by_mod';
    END IF;
    RETURN 'post_deleted_by_owner';
  END IF;

  IF p_to_status = 'blocked' THEN
    IF p_reason_code = 'reports_threshold' THEN
      RETURN 'post_auto_blocked_reports';
    END IF;
    RETURN 'post_blocked';
  END IF;

  IF p_to_status = 'hidden' THEN
    RETURN 'post_hidden';
  END IF;

  IF p_to_status = 'archived' THEN
    RETURN 'post_expired';
  END IF;

  IF p_to_status = 'draft' AND p_from_status IS DISTINCT FROM 'draft' THEN
    RETURN 'post_reverted_to_draft';
  END IF;

  IF p_to_status = 'active' THEN
    IF p_from_status = 'draft' THEN
      RETURN 'post_published';
    END IF;
    IF p_from_status IN ('hidden', 'archived', 'blocked') THEN
      RETURN 'post_restored';
    END IF;
  END IF;

  RETURN 'post_status_changed';
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_posts_audit_lifecycle()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_role text;
  v_event_type text;
  v_payload jsonb := '{}'::jsonb;
  v_context jsonb := '{}'::jsonb;
  v_context_raw text;
  v_renewed boolean := false;
BEGIN
  v_actor_role := public.resolve_audit_actor_role(NEW.user_id);

  v_context_raw := nullif(current_setting('app.audit_context', true), '');
  IF v_context_raw IS NOT NULL THEN
    BEGIN
      v_context := v_context_raw::jsonb;
    EXCEPTION WHEN others THEN
      v_context := '{}'::jsonb;
    END;
  END IF;

  IF TG_OP = 'INSERT' THEN
    v_payload := jsonb_build_object(
      'status', NEW.status::text,
      'category_type', NEW.category_type,
      'subcategory_slug', NEW.subcategory_slug
    ) || v_context;

    PERFORM public.insert_audit_event(
      'post',
      NEW.id::text,
      'post_created',
      auth.uid(),
      v_actor_role,
      v_payload
    );
    PERFORM set_config('app.audit_context', '', true);
    RETURN NEW;
  END IF;

  v_renewed := NEW.renew_count IS DISTINCT FROM OLD.renew_count
    AND coalesce(NEW.renew_count, 0) > coalesce(OLD.renew_count, 0);

  IF v_renewed THEN
    v_event_type := 'post_renewed';
    v_payload := jsonb_build_object(
      'from_status', OLD.status::text,
      'to_status', NEW.status::text,
      'renew_count', NEW.renew_count,
      'expires_at', NEW.expires_at,
      'status_reason_code', NEW.status_reason_code
    ) || v_context;

    PERFORM public.insert_audit_event(
      'post',
      NEW.id::text,
      v_event_type,
      auth.uid(),
      v_actor_role,
      v_payload
    );
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    -- post_status je ENUM — bez ::text Postgres nenajde resolve_*(text, text, …)
    v_event_type := public.resolve_post_audit_event_type(
      OLD.status::text,
      NEW.status::text,
      NEW.status_reason_code,
      v_actor_role
    );
    v_payload := jsonb_build_object(
      'from_status', OLD.status::text,
      'to_status', NEW.status::text,
      'status_reason_code', NEW.status_reason_code
    ) || v_context;

    PERFORM public.insert_audit_event(
      'post',
      NEW.id::text,
      v_event_type,
      auth.uid(),
      v_actor_role,
      v_payload
    );
  END IF;

  PERFORM set_config('app.audit_context', '', true);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_posts_audit_lifecycle ON public.posts;
CREATE TRIGGER trg_posts_audit_lifecycle
  AFTER INSERT OR UPDATE OF status, renew_count, expires_at, status_reason_code
  ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_posts_audit_lifecycle();

CREATE OR REPLACE FUNCTION public.trg_reports_audit_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_role text;
BEGIN
  IF NEW.target_type IS DISTINCT FROM 'post' OR NEW.target_post_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT public.resolve_audit_actor_role(p.user_id)
  INTO v_actor_role
  FROM public.posts p
  WHERE p.id = NEW.target_post_id;

  v_actor_role := coalesce(v_actor_role, 'user');

  PERFORM public.insert_audit_event(
    'post',
    NEW.target_post_id::text,
    'post_reported',
    NEW.reporter_user_id,
    CASE
      WHEN NEW.reporter_user_id IS NULL THEN 'user'
      ELSE v_actor_role
    END,
    jsonb_build_object(
      'reason', NEW.reason,
      'source', NEW.source,
      'report_no', NEW.report_no
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reports_audit_event ON public.reports;
CREATE TRIGGER trg_reports_audit_event
  AFTER INSERT ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_reports_audit_event();
