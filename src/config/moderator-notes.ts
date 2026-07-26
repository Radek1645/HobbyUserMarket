/** Moderátorské poznámky — sync s `moderator_note_kinds` (migrace 061). */

export const MODERATOR_NOTE_KIND = {
  zadanoUzivatelem: "zadano_uzivatelem",
} as const;

export type ModeratorNoteKindCode =
  (typeof MODERATOR_NOTE_KIND)[keyof typeof MODERATOR_NOTE_KIND];

export const MODERATOR_NOTE_KIND_LABELS: Record<ModeratorNoteKindCode, string> =
  {
    [MODERATOR_NOTE_KIND.zadanoUzivatelem]: "Zadáno uživatelem",
  };

export const MODERATOR_NOTE_KINDS: ReadonlyArray<{
  code: ModeratorNoteKindCode;
  label: string;
}> = [
  {
    code: MODERATOR_NOTE_KIND.zadanoUzivatelem,
    label: MODERATOR_NOTE_KIND_LABELS[MODERATOR_NOTE_KIND.zadanoUzivatelem],
  },
];

export const MODERATOR_NOTE_ENTITY = {
  post: "post",
  profile: "profile",
} as const;

export type ModeratorNoteEntityType =
  (typeof MODERATOR_NOTE_ENTITY)[keyof typeof MODERATOR_NOTE_ENTITY];

/** PRD §11.1 B */
export const MODERATOR_NOTE_MAX_LENGTH = 2000;
export const MODERATOR_NOTE_EDIT_WINDOW_HOURS = 24;
