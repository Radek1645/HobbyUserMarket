"use client";

import {
  createPostModeratorNote,
  updateModeratorNote,
} from "@/app/actions/moderator-notes";
import {
  MODERATOR_NOTE_KIND,
  MODERATOR_NOTE_KINDS,
  MODERATOR_NOTE_MAX_LENGTH,
} from "@/config/moderator-notes";
import { getListingPath } from "@/lib/posts/listing-path";
import type { ModeratorNoteRow } from "@/lib/mod/moderator-notes";
import { useState } from "react";

type ModeratorNotesPanelProps = {
  postId: number;
  postSlug: string;
  notes: ModeratorNoteRow[];
  flash?: "created" | "updated" | "error" | null;
  /** Uvnitř God Mode lišty — bez vlastního vnějšího rámečku. */
  embedded?: boolean;
};

function formatNoteTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("cs-CZ", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function ModeratorNotesPanel({
  postId,
  postSlug,
  notes,
  flash = null,
  embedded = false,
}: ModeratorNotesPanelProps) {
  const [editingNoteNo, setEditingNoteNo] = useState<number | null>(null);
  const returnPath = getListingPath(postSlug);
  const shellClass = embedded
    ? "rounded-xl border border-amber-200 bg-white px-3 py-3 text-sm text-amber-950"
    : "mb-6 rounded-2xl border border-amber-200 bg-white px-4 py-4 text-sm text-amber-950";

  return (
    <div className={shellClass}>
      <p className="font-semibold">Poznámky moderátora</p>
      <p className="mt-1 text-xs text-amber-900/80">
        Vidí jen staff. Uživatel je nevidí. Úprava vlastní poznámky do 24 hodin.
      </p>

      {flash === "created" || flash === "updated" ? (
        <p
          className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900"
          role="status"
        >
          {flash === "created" ? "Poznámka uložena." : "Poznámka upravena."}
        </p>
      ) : null}
      {flash === "error" ? (
        <p
          className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800"
          role="alert"
        >
          Poznámku se nepodařilo uložit. Zkontrolujte text (1–
          {MODERATOR_NOTE_MAX_LENGTH} znaků) nebo okno úpravy (24 h).
        </p>
      ) : null}

      <form action={createPostModeratorNote} className="mt-4 space-y-3">
        <input type="hidden" name="postId" value={postId} />
        <input type="hidden" name="postSlug" value={postSlug} />
        <input type="hidden" name="returnPath" value={returnPath} />
        <label className="block">
          <span className="text-xs font-medium text-amber-950">
            Typ poznámky
          </span>
          <select
            name="kindCode"
            required
            defaultValue={MODERATOR_NOTE_KIND.zadanoUzivatelem}
            className="mt-1 w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm text-gray-900"
          >
            {MODERATOR_NOTE_KINDS.map((kind) => (
              <option key={kind.code} value={kind.code}>
                {kind.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-medium text-amber-950">
            Nová poznámka
          </span>
          <textarea
            name="body"
            required
            rows={3}
            maxLength={MODERATOR_NOTE_MAX_LENGTH}
            placeholder="Např. Volal, slíbil upravit fotky."
            className="mt-1 w-full rounded-xl border border-amber-200 px-3 py-2 text-sm text-gray-900"
          />
        </label>
        <button
          type="submit"
          className="rounded-lg border border-amber-400 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-950 transition hover:bg-amber-100"
        >
          Přidat poznámku
        </button>
      </form>

      {notes.length === 0 ? (
        <p className="mt-4 text-xs text-amber-900/70">Zatím žádné poznámky.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {notes.map((note) => (
            <li
              key={note.noteNo}
              className="rounded-xl border border-amber-100 bg-amber-50/50 px-3 py-3"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs text-amber-900/80">
                <span>
                  #{note.noteNo} · {note.kindLabel} ·{" "}
                  {note.authorNickname ?? "moderátor"} ·{" "}
                  {formatNoteTime(note.createdAt)}
                </span>
                {note.canEdit ? (
                  <button
                    type="button"
                    onClick={() =>
                      setEditingNoteNo((current) =>
                        current === note.noteNo ? null : note.noteNo,
                      )
                    }
                    className="font-medium underline-offset-2 hover:underline"
                  >
                    {editingNoteNo === note.noteNo ? "Zrušit úpravu" : "Upravit"}
                  </button>
                ) : null}
              </div>

              {editingNoteNo === note.noteNo ? (
                <form action={updateModeratorNote} className="mt-2 space-y-2">
                  <input type="hidden" name="noteNo" value={note.noteNo} />
                  <input type="hidden" name="postSlug" value={postSlug} />
                  <input type="hidden" name="returnPath" value={returnPath} />
                  <textarea
                    name="body"
                    required
                    rows={3}
                    maxLength={MODERATOR_NOTE_MAX_LENGTH}
                    defaultValue={note.body}
                    className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm text-gray-900"
                  />
                  <button
                    type="submit"
                    className="rounded-lg border border-amber-400 bg-white px-3 py-1.5 text-xs font-medium text-amber-950"
                  >
                    Uložit změny
                  </button>
                </form>
              ) : (
                <p className="mt-2 whitespace-pre-wrap text-sm text-gray-900">
                  {note.body}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
