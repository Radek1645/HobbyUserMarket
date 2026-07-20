"use client";

import { LISTING_DESCRIPTION_MAX_LENGTH } from "@/config/app";
import { MODERATION_MAX_QUESTIONS, MODERATION_PREVIEW_UI } from "@/config/moderation";
import {
  listingFormPrimaryButtonClass,
  listingFormSecondaryButtonClass,
} from "@/config/listing-form-ui";
import { appendQuestionAnswersToDescription } from "@/lib/moderation/append-question-answers";
import type { ModerationQuestion } from "@/lib/moderation/types";
import { Info, Loader2 } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

export type ModerationPreviewState = {
  originalTitle: string;
  originalDescription: string;
  aiTitle: string;
  aiDescription: string;
  metaDescription?: string;
  imageAlt?: string;
  questions: ModerationQuestion[];
};

type ModerationPreviewDialogProps = {
  preview: ModerationPreviewState | null;
  publishing?: boolean;
  onClose: () => void;
  onPublishAi: (payload: {
    title: string;
    description: string;
    metaDescription?: string;
    imageAlt?: string;
    questionAnswers: Record<string, string>;
  }) => void;
  onPublishOriginal: () => void;
};

function PreviewFieldInfo({
  label,
  help,
}: {
  label: string;
  help: string;
}) {
  const helpId = useId();
  const rootRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    function closeOnOutsideClick(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [open]);

  return (
    <span className="inline-flex items-center gap-1">
      <span>{label}</span>
      <span ref={rootRef} className="relative inline-flex">
        <button
          type="button"
          className="rounded-full text-neutral-400 transition hover:text-neutral-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/35"
          aria-expanded={open}
          aria-controls={helpId}
          aria-label={`Vysvětlení: ${label}`}
          onClick={() => setOpen((current) => !current)}
        >
          <Info className="h-3.5 w-3.5" aria-hidden />
        </button>
        {open ? (
          <span
            id={helpId}
            role="tooltip"
            className="absolute left-0 top-full z-20 mt-1.5 w-[min(16rem,calc(100vw-3rem))] rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-normal leading-relaxed text-neutral-700 shadow-md"
          >
            {help}
          </span>
        ) : null}
      </span>
    </span>
  );
}

export function ModerationPreviewDialog({
  preview,
  publishing = false,
  onClose,
  onPublishAi,
  onPublishOriginal,
}: ModerationPreviewDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const publishAiRef = useRef<HTMLButtonElement>(null);

  const [aiTitle, setAiTitle] = useState("");
  const [aiDescription, setAiDescription] = useState("");
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, string>>(
    {},
  );

  useEffect(() => {
    if (!preview) return;

    setAiTitle(preview.aiTitle ?? "");
    setAiDescription(preview.aiDescription ?? "");
    setQuestionAnswers({});
    publishAiRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !publishing) onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [preview, onClose, publishing]);

  const visibleQuestions = useMemo(
    () => (preview?.questions ?? []).slice(0, MODERATION_MAX_QUESTIONS),
    [preview?.questions],
  );

  const projectedDescription = useMemo(
    () =>
      appendQuestionAnswersToDescription(
        aiDescription,
        visibleQuestions,
        questionAnswers,
      ),
    [aiDescription, visibleQuestions, questionAnswers],
  );

  const descriptionOverLimit =
    projectedDescription.length > LISTING_DESCRIPTION_MAX_LENGTH;

  if (!preview) return null;

  const currentPreview = preview;

  function handlePublishAi() {
    onPublishAi({
      title: (aiTitle ?? "").trim(),
      description: (aiDescription ?? "").trim(),
      metaDescription: currentPreview.metaDescription?.trim() || undefined,
      imageAlt: currentPreview.imageAlt?.trim() || undefined,
      questionAnswers,
    });
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Zavřít"
        disabled={publishing}
        className="absolute inset-0 bg-gray-900/50 backdrop-blur-[1px] disabled:cursor-not-allowed"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="moderation-preview-title"
        className="relative flex max-h-[min(92vh,820px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-neutral-300 bg-white shadow-xl"
      >
        <div className="border-b border-neutral-200 px-5 py-3 sm:px-6">
          <h2
            id="moderation-preview-title"
            className="text-lg font-semibold text-neutral-900"
          >
            {MODERATION_PREVIEW_UI.title}
          </h2>
          <p className="mt-1.5 text-xs leading-relaxed text-neutral-600">
            {MODERATION_PREVIEW_UI.subtitle}
          </p>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4 sm:px-6">
          {publishing ? (
            <div
              role="status"
              aria-live="polite"
              className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950"
            >
              <Loader2
                className="h-5 w-5 shrink-0 animate-spin text-emerald-700"
                aria-hidden
              />
              <span>Ukládám inzerát…</span>
            </div>
          ) : null}

          <div>
            <label htmlFor={titleId} className="block text-sm font-semibold text-neutral-900">
              {MODERATION_PREVIEW_UI.titleLabel}
            </label>
            <input
              id={titleId}
              type="text"
              value={aiTitle}
              disabled={publishing}
              onChange={(event) => setAiTitle(event.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-500 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-600/35 disabled:opacity-60"
            />
          </div>

          <div>
            <label
              htmlFor={descriptionId}
              className="block text-sm font-semibold text-neutral-900"
            >
              {MODERATION_PREVIEW_UI.descriptionLabel}
            </label>
            <textarea
              id={descriptionId}
              value={aiDescription}
              disabled={publishing}
              onChange={(event) => setAiDescription(event.target.value)}
              rows={6}
              maxLength={LISTING_DESCRIPTION_MAX_LENGTH}
              className="mt-1 max-h-36 w-full resize-none overflow-y-auto rounded-xl border border-neutral-500 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-600/35 disabled:opacity-60"
            />
            <p
              className={[
                "mt-1 text-xs",
                descriptionOverLimit
                  ? "font-medium text-red-700"
                  : "text-neutral-600",
              ].join(" ")}
            >
              {descriptionOverLimit
                ? MODERATION_PREVIEW_UI.descriptionLengthWarning(
                    projectedDescription.length,
                    LISTING_DESCRIPTION_MAX_LENGTH,
                  )
                : MODERATION_PREVIEW_UI.descriptionLengthCounter(
                    projectedDescription.length,
                    LISTING_DESCRIPTION_MAX_LENGTH,
                  )}
            </p>
          </div>

          {preview.metaDescription?.trim() ? (
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5">
              <p className="text-xs font-semibold text-neutral-700">
                <PreviewFieldInfo
                  label={MODERATION_PREVIEW_UI.metaDescriptionLabel}
                  help={MODERATION_PREVIEW_UI.metaDescriptionHelp}
                />
              </p>
              <p className="mt-1 text-sm text-neutral-800">
                {preview.metaDescription.trim()}
              </p>
            </div>
          ) : null}

          {preview.imageAlt?.trim() ? (
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5">
              <p className="text-xs font-semibold text-neutral-700">
                <PreviewFieldInfo
                  label={MODERATION_PREVIEW_UI.imageAltLabel}
                  help={MODERATION_PREVIEW_UI.imageAltHelp}
                />
              </p>
              <p className="mt-1 text-sm text-neutral-800">
                {preview.imageAlt.trim()}
              </p>
            </div>
          ) : null}

          {visibleQuestions.length > 0 ? (
            <fieldset className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <legend className="px-1 text-sm font-semibold text-neutral-900">
                {MODERATION_PREVIEW_UI.questionsHeading}
              </legend>
              <p className="mt-1 text-xs leading-relaxed text-neutral-600">
                {MODERATION_PREVIEW_UI.questionsHint}
              </p>
              <p className="mt-1.5 text-xs italic leading-relaxed text-neutral-500">
                {MODERATION_PREVIEW_UI.questionsSkipHint}
              </p>
              <ul className="mt-3 space-y-3">
                {visibleQuestions.map((question) => (
                  <li key={question.id}>
                    <label
                      htmlFor={`moderation-q-${question.id}`}
                      className="block text-sm font-medium text-neutral-800"
                    >
                      {question.label}
                    </label>
                    <input
                      id={`moderation-q-${question.id}`}
                      type="text"
                      disabled={publishing}
                      value={questionAnswers[question.id] ?? ""}
                      onChange={(event) =>
                        setQuestionAnswers((current) => ({
                          ...current,
                          [question.id]: event.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-xl border border-neutral-500 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-600/35 disabled:opacity-60"
                    />
                  </li>
                ))}
              </ul>
            </fieldset>
          ) : null}
        </div>

        <div className="space-y-2 border-t border-neutral-200 bg-neutral-50 px-5 py-4 sm:px-6">
          <button
            ref={publishAiRef}
            type="button"
            disabled={
              publishing ||
              !(aiTitle ?? "").trim() ||
              !projectedDescription.trim() ||
              descriptionOverLimit
            }
            onClick={handlePublishAi}
            className={`flex w-full flex-col items-center ${listingFormPrimaryButtonClass}`}
          >
            {publishing ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Ukládám…
              </span>
            ) : (
              <span>{MODERATION_PREVIEW_UI.publishAiLabel}</span>
            )}
            {!publishing ? (
              <span className="mt-0.5 text-xs font-normal text-white/80">
                {MODERATION_PREVIEW_UI.publishAiHint}
              </span>
            ) : null}
          </button>

          <button
            type="button"
            disabled={publishing}
            onClick={onPublishOriginal}
            className={`flex w-full flex-col items-center ${listingFormSecondaryButtonClass}`}
          >
            <span>{MODERATION_PREVIEW_UI.publishOriginalLabel}</span>
            <span className="mt-0.5 text-center text-xs font-normal text-neutral-600">
              {MODERATION_PREVIEW_UI.publishOriginalHint}
            </span>
          </button>

          <button
            type="button"
            disabled={publishing}
            onClick={onClose}
            className="w-full rounded-xl px-4 py-2.5 text-sm font-medium text-neutral-600 transition hover:bg-neutral-200/80 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {MODERATION_PREVIEW_UI.cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
