import type { ListingModerationFailure } from "@/lib/moderation/types";
import {
  getProhibitedTopic,
  LISTING_TERMS_PATH,
  MODERATION_REJECTION_UI,
  PROHIBITED_TOPICS,
} from "@/config/moderation";
import Link from "next/link";
import { useEffect, useRef } from "react";

export type ModerationRejectionState = {
  reason: string;
  topicId?: string;
  rejectedImageIndex?: number;
};

type ModerationRejectedDialogProps = {
  rejection: ModerationRejectionState | null;
  onClose: () => void;
};

export function ModerationRejectedDialog({
  rejection,
  onClose,
}: ModerationRejectedDialogProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const violatedTopic = rejection?.topicId
    ? getProhibitedTopic(rejection.topicId)
    : undefined;

  useEffect(() => {
    if (!rejection) return;

    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    closeButtonRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [rejection, onClose]);

  if (!rejection) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Zavřít"
        className="absolute inset-0 bg-gray-900/50 backdrop-blur-[1px]"
        onClick={onClose}
      />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="moderation-rejected-title"
        aria-describedby="moderation-rejected-desc"
        className="relative w-full max-w-md rounded-2xl border border-red-200 bg-white p-5 shadow-xl sm:p-6"
      >
        <h2
          id="moderation-rejected-title"
          className="text-lg font-semibold text-gray-900"
        >
          {MODERATION_REJECTION_UI.title}
        </h2>

        <p id="moderation-rejected-desc" className="mt-2 text-sm text-gray-600">
          {MODERATION_REJECTION_UI.intro}
        </p>

        <p className="mt-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-900">
          {rejection.reason}
          {violatedTopic ? (
            <>
              {" "}
              <span className="font-semibold">({violatedTopic.label})</span>
            </>
          ) : null}
          {typeof rejection.rejectedImageIndex === "number" &&
          rejection.rejectedImageIndex >= 0 ? (
            <>
              {" "}
              <span className="font-semibold">
                Problémová fotka č. {rejection.rejectedImageIndex + 1}.
              </span>
            </>
          ) : null}
        </p>

        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            {MODERATION_REJECTION_UI.summaryHeading}
          </p>
          <ul className="mt-2 max-h-36 space-y-1 overflow-y-auto text-sm text-gray-700">
            {PROHIBITED_TOPICS.map((topic) => {
              const isViolated = topic.id === rejection.topicId;
              return (
                <li key={topic.id} className="flex gap-2">
                  <span
                    aria-hidden="true"
                    className={isViolated ? "text-red-400" : "text-gray-400"}
                  >
                    ·
                  </span>
                  <span
                    className={
                      isViolated ? "font-semibold text-red-700" : undefined
                    }
                  >
                    {topic.label}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <p className="mt-4 text-sm text-gray-600">
          Podrobnosti najdete v{" "}
          <Link
            href={LISTING_TERMS_PATH}
            className="font-medium text-gray-900 underline-offset-2 hover:underline"
            onClick={onClose}
          >
            {MODERATION_REJECTION_UI.termsLinkLabel}
          </Link>
          .
        </p>

        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          className="mt-5 flex w-full items-center justify-center rounded-xl bg-gray-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          {MODERATION_REJECTION_UI.closeLabel}
        </button>
      </div>
    </div>
  );
}

export function moderationFailureToRejection(
  failure: ListingModerationFailure,
): ModerationRejectionState | null {
  if (failure.kind !== "rejected") return null;
  return {
    reason: failure.reason,
    topicId: failure.topicId,
    rejectedImageIndex: failure.rejectedImageIndex,
  };
}
