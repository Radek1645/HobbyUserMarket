import {
  MODERATOR_NOTE_EDIT_WINDOW_HOURS,
  MODERATOR_NOTE_ENTITY,
  MODERATOR_NOTE_KIND_LABELS,
  type ModeratorNoteKindCode,
} from "@/config/moderator-notes";
import { createClient } from "@/lib/supabase/server";

export type ModeratorNoteRow = {
  noteNo: number;
  createdAt: string;
  updatedAt: string;
  kindCode: ModeratorNoteKindCode;
  kindLabel: string;
  body: string;
  authorUserId: string;
  authorNickname: string | null;
  canEdit: boolean;
};

type NoteDbRow = {
  note_no: number;
  created_at: string;
  updated_at: string;
  kind_code: string;
  body: string;
  author_user_id: string;
};

function isWithinEditWindow(createdAt: string): boolean {
  const createdMs = new Date(createdAt).getTime();
  if (Number.isNaN(createdMs)) return false;
  const windowMs = MODERATOR_NOTE_EDIT_WINDOW_HOURS * 60 * 60 * 1000;
  return Date.now() - createdMs <= windowMs;
}

/** Načte poznámky k inzerátu pro God Mode (nejnovější nahoře). */
export async function loadModeratorNotesForPost(
  postId: number,
  currentUserId: string,
): Promise<ModeratorNoteRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("moderator_notes")
    .select("note_no, created_at, updated_at, kind_code, body, author_user_id")
    .eq("entity_type", MODERATOR_NOTE_ENTITY.post)
    .eq("entity_id", String(postId))
    .order("created_at", { ascending: false });

  if (error || !data?.length) {
    if (error) console.error("loadModeratorNotesForPost:", error);
    return [];
  }

  const rows = data as NoteDbRow[];
  const authorIds = [...new Set(rows.map((row) => row.author_user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, nickname")
    .in("id", authorIds);

  const nicknameById = new Map(
    (profiles ?? []).map((profile) => [
      profile.id as string,
      (profile.nickname as string | null) ?? null,
    ]),
  );

  return rows.map((row) => {
    const kindCode = row.kind_code as ModeratorNoteKindCode;
    return {
      noteNo: row.note_no,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      kindCode,
      kindLabel: MODERATOR_NOTE_KIND_LABELS[kindCode] ?? row.kind_code,
      body: row.body,
      authorUserId: row.author_user_id,
      authorNickname: nicknameById.get(row.author_user_id) ?? null,
      canEdit:
        row.author_user_id === currentUserId &&
        isWithinEditWindow(row.created_at),
    };
  });
}
