-- =============================================================================
-- 069 — Exit poll při smazání zboží: posts.deletion_reason
-- =============================================================================

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

ALTER TABLE public.posts
  DROP CONSTRAINT IF EXISTS posts_deletion_reason_check;

ALTER TABLE public.posts
  ADD CONSTRAINT posts_deletion_reason_check
  CHECK (
    deletion_reason IS NULL
    OR deletion_reason IN ('sold_on_platform', 'other')
  );

CREATE INDEX IF NOT EXISTS posts_deletion_reason_idx
  ON public.posts (deletion_reason)
  WHERE deletion_reason IS NOT NULL;

-- Audit payload při změně statusu (včetně soft-delete majitelem).
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
    v_event_type := public.resolve_post_audit_event_type(
      OLD.status::text,
      NEW.status::text,
      NEW.status_reason_code,
      v_actor_role
    );
    v_payload := jsonb_build_object(
      'from_status', OLD.status::text,
      'to_status', NEW.status::text,
      'status_reason_code', NEW.status_reason_code,
      'deletion_reason', NEW.deletion_reason
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
