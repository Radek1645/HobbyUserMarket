"use client";

import { LISTING_DESCRIPTION_MAX_LENGTH } from "@/config/app";
import {
  LISTING_IMAGE_ALT_MAX_LENGTH,
  LISTING_META_DESCRIPTION_MAX_LENGTH,
} from "@/config/listing-seo";
import { MODERATION_MAX_QUESTIONS, MODERATION_PREVIEW_UI } from "@/config/moderation";
import {
  listingFormPrimaryButtonClass,
  listingFormSecondaryButtonClass,
} from "@/config/listing-form-ui";
import { appendQuestionAnswersToDescription } from "@/lib/moderation/append-question-answers";
import type { ModerationQuestion } from "@/lib/moderation/types";
import { ChevronDown, Info, Loader2, Pencil } from "lucide-react";
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
  const [metaDescription, setMetaDescription] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [seoOpen, setSeoOpen] = useState(false);
  const [seoEditing, setSeoEditing] = useState(false);
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, string>>(
    {},
  );
  const metaFieldId = useId();
  const altFieldId = useId();
  const seoPanelId = useId();
  const metaInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!preview) return;

    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    setAiTitle(preview.aiTitle ?? "");
    setAiDescription(preview.aiDescription ?? "");
    setMetaDescription(preview.metaDescription?.trim() ?? "");
    setImageAlt(preview.imageAlt?.trim() ?? "");
    setSeoOpen(false);
    setSeoEditing(false);
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
      previousFocus?.focus();
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

  function handlePublishAi() {
    onPublishAi({
      title: (aiTitle ?? "").trim(),
      description: (aiDescription ?? "").trim(),
      metaDescription: metaDescription.trim() || undefined,
      imageAlt: imageAlt.trim() || undefined,
      questionAnswers,
    });
  }

  function toggleSeoEditing() {
    if (seoEditing) {
      setSeoEditing(false);
      return;
    }
    setSeoOpen(true);
    setSeoEditing(true);
    requestAnimationFrame(() => metaInputRef.current?.focus());
  }

  function toggleSeoOpen() {
    setSeoOpen((open) => {
      if (open) setSeoEditing(false);
      return !open;
    });
  }

  const showSeoSection =
    Boolean(preview.metaDescription?.trim()) ||
    Boolean(preview.imageAlt?.trim()) ||
    Boolean(metaDescription.trim()) ||
    Boolean(imageAlt.trim());

  const seoSummary = metaDescription.trim() || imageAlt.trim();

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

          {showSeoSection ? (
            <div className="rounded-xl border border-neutral-200 bg-neutral-50">
              <div className="flex items-stretch gap-0.5">
                <button
                  type="button"
                  disabled={publishing}
                  aria-expanded={seoOpen}
                  aria-controls={seoPanelId}
                  onClick={toggleSeoOpen}
                  className="flex min-w-0 flex-1 items-start gap-2 px-3 py-2.5 text-left transition hover:bg-neutral-100/80 disabled:opacity-60"
                >
                  <ChevronDown
                    className={[
                      "mt-0.5 h-4 w-4 shrink-0 text-neutral-500 transition-transform",
                      seoOpen ? "rotate-0" : "-rotate-90",
                    ].join(" ")}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold text-neutral-800">
                      {MODERATION_PREVIEW_UI.seoSectionLabel}
                    </span>
                    {!seoOpen && seoSummary ? (
                      <span className="mt-0.5 block truncate text-xs text-neutral-500">
                        {seoSummary}
                      </span>
                    ) : (
                      <span className="mt-0.5 block text-xs text-neutral-500">
                        {seoEditing
                          ? MODERATION_PREVIEW_UI.seoSectionHint
                          : MODERATION_PREVIEW_UI.seoLockedHint}
                      </span>
                    )}
                  </span>
                </button>
                <button
                  type="button"
                  disabled={publishing}
                  aria-label={
                    seoEditing
                      ? MODERATION_PREVIEW_UI.seoLockAriaLabel
                      : MODERATION_PREVIEW_UI.seoEditAriaLabel
                  }
                  aria-pressed={seoEditing}
                  onClick={toggleSeoEditing}
                  className={[
                    "shrink-0 self-center rounded-lg p-2 transition disabled:opacity-60",
                    seoEditing
                      ? "bg-blue-100 text-blue-800 hover:bg-blue-200/80"
                      : "text-neutral-500 hover:bg-neutral-200/80 hover:text-neutral-800",
                  ].join(" ")}
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden />
                </button>
              </div>

              {seoOpen ? (
                <div
                  id={seoPanelId}
                  className="space-y-3 border-t border-neutral-200 px-3 py-3"
                >
                  <div>
                    <div className="text-xs font-semibold text-neutral-700">
                      <PreviewFieldInfo
                        label={MODERATION_PREVIEW_UI.metaDescriptionLabel}
                        help={MODERATION_PREVIEW_UI.metaDescriptionHelp}
                      />
                    </div>
                    {seoEditing ? (
                      <>
                        <textarea
                          ref={metaInputRef}
                          id={metaFieldId}
                          value={metaDescription}
                          disabled={publishing}
                          maxLength={LISTING_META_DESCRIPTION_MAX_LENGTH}
                          rows={3}
                          aria-label={MODERATION_PREVIEW_UI.metaDescriptionLabel}
                          onChange={(event) =>
                            setMetaDescription(event.target.value)
                          }
                          className="mt-1 w-full resize-none rounded-lg border border-neutral-400 bg-white px-2.5 py-2 text-sm text-neutral-900 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-600/35 disabled:opacity-60"
                        />
                        <p className="mt-1 text-xs text-neutral-500">
                          {metaDescription.length} /{" "}
                          {LISTING_META_DESCRIPTION_MAX_LENGTH}
                        </p>
                      </>
                    ) : (
                      <p className="mt-1 rounded-lg border border-transparent bg-white/70 px-2.5 py-2 text-sm text-neutral-800">
                        {metaDescription.trim() || "—"}
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-neutral-700">
                      <PreviewFieldInfo
                        label={MODERATION_PREVIEW_UI.imageAltLabel}
                        help={MODERATION_PREVIEW_UI.imageAltHelp}
                      />
                    </div>
                    {seoEditing ? (
                      <>
                        <textarea
                          id={altFieldId}
                          value={imageAlt}
                          disabled={publishing}
                          maxLength={LISTING_IMAGE_ALT_MAX_LENGTH}
                          rows={2}
                          aria-label={MODERATION_PREVIEW_UI.imageAltLabel}
                          onChange={(event) => setImageAlt(event.target.value)}
                          className="mt-1 w-full resize-none rounded-lg border border-neutral-400 bg-white px-2.5 py-2 text-sm text-neutral-900 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-600/35 disabled:opacity-60"
                        />
                        <p className="mt-1 text-xs text-neutral-500">
                          {imageAlt.length} / {LISTING_IMAGE_ALT_MAX_LENGTH}
                        </p>
                      </>
                    ) : (
                      <p className="mt-1 rounded-lg border border-transparent bg-white/70 px-2.5 py-2 text-sm text-neutral-800">
                        {imageAlt.trim() || "—"}
                      </p>
                    )}
                  </div>
                </div>
              ) : null}
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
