"use client";

import { LISTING_DESCRIPTION_MAX_LENGTH } from "@/config/app";
import { MODERATION_MAX_QUESTIONS, MODERATION_PREVIEW_UI } from "@/config/moderation";
import {
  listingFormPrimaryButtonClass,
  listingFormSecondaryButtonClass,
} from "@/config/listing-form-ui";
import { appendQuestionAnswersToDescription } from "@/lib/moderation/append-question-answers";
import type { ModerationQuestion } from "@/lib/moderation/types";
import { Loader2 } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

export type ModerationPreviewState = {
  originalTitle: string;
  originalDescription: string;
  aiTitle: string;
  aiDescription: string;
  questions: ModerationQuestion[];
};

type ModerationPreviewDialogProps = {
  preview: ModerationPreviewState | null;
  publishing?: boolean;
  onClose: () => void;
  onPublishAi: (payload: {
    title: string;
    description: string;
    questionAnswers: Record<string, string>;
  }) => void;
  onPublishOriginal: () => void;
};

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

  const missingQuestionIds = useMemo(
    () => getMissingModerationQuestionIds(visibleQuestions, questionAnswers),
    [visibleQuestions, questionAnswers],
  );

  const questionsIncomplete = missingQuestionIds.length > 0;

  if (!preview) return null;

  function handlePublishAi() {
    if (
      getMissingModerationQuestionIds(visibleQuestions, questionAnswers).length >
      0
    ) {
      return;
    }

    onPublishAi({
      title: (aiTitle ?? "").trim(),
      description: (aiDescription ?? "").trim(),
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
        <div className="border-b border-neutral-200 px-5 py-4 sm:px-6">
          <h2
            id="moderation-preview-title"
            className="text-lg font-semibold text-neutral-900"
          >
            {MODERATION_PREVIEW_UI.title}
          </h2>
          <p className="mt-1 text-sm text-neutral-600">
            {MODERATION_PREVIEW_UI.intro}
          </p>
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-950">
            {MODERATION_PREVIEW_UI.disclaimer}
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
              rows={8}
              maxLength={LISTING_DESCRIPTION_MAX_LENGTH}
              className="mt-1 w-full resize-y rounded-xl border border-neutral-500 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-600/35 disabled:opacity-60"
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

          {visibleQuestions.length > 0 ? (
            <fieldset className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <legend className="px-1 text-sm font-semibold text-neutral-900">
                {MODERATION_PREVIEW_UI.questionsHeading}
              </legend>
              <p className="mt-1 text-xs text-neutral-600">
                {MODERATION_PREVIEW_UI.questionsHint}
              </p>
              <ul className="mt-3 space-y-3">
                {visibleQuestions.map((question) => {
                  const isMissing = missingQuestionIds.includes(question.id);

                  return (
                  <li key={question.id}>
                    <label
                      htmlFor={`moderation-q-${question.id}`}
                      className="block text-sm font-medium text-neutral-800"
                    >
                      {question.label}
                      <span className="font-normal text-neutral-500">
                        {MODERATION_PREVIEW_UI.questionRequiredMark}
                      </span>
                    </label>
                    <input
                      id={`moderation-q-${question.id}`}
                      type="text"
                      required
                      disabled={publishing}
                      value={questionAnswers[question.id] ?? ""}
                      aria-invalid={isMissing}
                      onChange={(event) =>
                        setQuestionAnswers((current) => ({
                          ...current,
                          [question.id]: event.target.value,
                        }))
                      }
                      className={[
                        "mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:ring-2 disabled:opacity-60",
                        isMissing
                          ? "border-red-600 focus:border-red-700 focus:ring-red-600/35"
                          : "border-neutral-500 focus:border-blue-700 focus:ring-blue-600/35",
                      ].join(" ")}
                    />
                  </li>
                  );
                })}
              </ul>
              {questionsIncomplete ? (
                <p className="mt-3 text-xs font-medium text-red-700">
                  {MODERATION_PREVIEW_UI.questionsIncompleteWarning}
                </p>
              ) : null}
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
              descriptionOverLimit ||
              questionsIncomplete
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

/** ID otázek bez neprázdné odpovědi. */
export function getMissingModerationQuestionIds(
  questions: ModerationQuestion[],
  answers: Record<string, string>,
): string[] {
  return questions
    .filter((question) => !answers[question.id]?.trim())
    .map((question) => question.id);
}
