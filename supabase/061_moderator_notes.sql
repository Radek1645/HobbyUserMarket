-- =============================================================================
-- 061 — Moderátorské poznámky + číselník typů (PRD §11.1 B)
-- Interní kontext pro staff; běžný uživatel nevidí.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.moderator_note_kinds (
  code        TEXT PRIMARY KEY,
  label       TEXT NOT NULL,
  sort_order  SMALLINT NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT moderator_note_kinds_code_not_empty
    CHECK (char_length(trim(code)) > 0),
  CONSTRAINT moderator_note_kinds_label_not_empty
    CHECK (char_length(trim(label)) > 0)
);

COMMENT ON TABLE public.moderator_note_kinds IS
  'Číselník typů moderátorských poznámek.';

INSERT INTO public.moderator_note_kinds (code, label, sort_order)
VALUES ('zadano_uzivatelem', 'Zadáno uživatelem', 10)
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.moderator_notes (
  note_no         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  entity_type     TEXT NOT NULL,
  entity_id       TEXT NOT NULL,
  kind_code       TEXT NOT NULL
    REFERENCES public.moderator_note_kinds (code),
  body            TEXT NOT NULL,
  author_user_id  UUID NOT NULL
    REFERENCES auth.users (id) ON DELETE CASCADE,

  CONSTRAINT moderator_notes_entity_type_check
    CHECK (entity_type IN ('post', 'profile')),
  CONSTRAINT moderator_notes_entity_id_not_empty
    CHECK (char_length(trim(entity_id)) > 0),
  CONSTRAINT moderator_notes_body_length
    CHECK (char_length(body) BETWEEN 1 AND 2000)
);

CREATE INDEX IF NOT EXISTS moderator_notes_entity_idx
  ON public.moderator_notes (entity_type, entity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS moderator_notes_author_idx
  ON public.moderator_notes (author_user_id, created_at DESC);

COMMENT ON TABLE public.moderator_notes IS
  'Ruční poznámky moderátora/admina u inzerátu nebo profilu. Edit jen autor do 24 h.';

CREATE OR REPLACE FUNCTION public.trg_moderator_notes_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_moderator_notes_set_updated_at ON public.moderator_notes;
CREATE TRIGGER trg_moderator_notes_set_updated_at
  BEFORE UPDATE ON public.moderator_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_moderator_notes_set_updated_at();

-- Editace jen autor a jen do 24 h od created_at (PRD §11.1 B).
CREATE OR REPLACE FUNCTION public.trg_moderator_notes_edit_window()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.author_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'moderator_note_not_author'
      USING ERRCODE = '42501';
  END IF;

  IF OLD.created_at < now() - interval '24 hours' THEN
    RAISE EXCEPTION 'moderator_note_edit_window_expired'
      USING ERRCODE = 'P0001';
  END IF;

  NEW.author_user_id := OLD.author_user_id;
  NEW.entity_type := OLD.entity_type;
  NEW.entity_id := OLD.entity_id;
  NEW.kind_code := OLD.kind_code;
  NEW.created_at := OLD.created_at;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_moderator_notes_edit_window ON public.moderator_notes;
CREATE TRIGGER trg_moderator_notes_edit_window
  BEFORE UPDATE ON public.moderator_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_moderator_notes_edit_window();

ALTER TABLE public.moderator_note_kinds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderator_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS moderator_note_kinds_select_staff ON public.moderator_note_kinds;
CREATE POLICY moderator_note_kinds_select_staff ON public.moderator_note_kinds
  FOR SELECT TO authenticated
  USING (public.is_moderator_or_admin());

DROP POLICY IF EXISTS moderator_notes_select_staff ON public.moderator_notes;
CREATE POLICY moderator_notes_select_staff ON public.moderator_notes
  FOR SELECT TO authenticated
  USING (public.is_moderator_or_admin());

DROP POLICY IF EXISTS moderator_notes_insert_staff ON public.moderator_notes;
CREATE POLICY moderator_notes_insert_staff ON public.moderator_notes
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_moderator_or_admin()
    AND author_user_id = auth.uid()
  );

DROP POLICY IF EXISTS moderator_notes_update_author ON public.moderator_notes;
CREATE POLICY moderator_notes_update_author ON public.moderator_notes
  FOR UPDATE TO authenticated
  USING (
    public.is_moderator_or_admin()
    AND author_user_id = auth.uid()
    AND created_at >= now() - interval '24 hours'
  )
  WITH CHECK (
    public.is_moderator_or_admin()
    AND author_user_id = auth.uid()
  );

GRANT SELECT ON public.moderator_note_kinds TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.moderator_notes TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.moderator_notes TO service_role;
GRANT SELECT ON public.moderator_note_kinds TO service_role;
