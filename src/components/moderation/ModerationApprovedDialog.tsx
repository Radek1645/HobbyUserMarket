import { MODERATION_APPROVED_UI } from "@/config/moderation";
import { CheckCircle2 } from "lucide-react";
import { useEffect, useRef } from "react";

type ModerationApprovedDialogProps = {
  open: boolean;
  isEdit?: boolean;
  onContinue: () => void;
};

export function ModerationApprovedDialog({
  open,
  isEdit = false,
  onContinue,
}: ModerationApprovedDialogProps) {
  const continueButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    continueButtonRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onContinue();
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onContinue]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Zavřít"
        className="absolute inset-0 bg-gray-900/50 backdrop-blur-[1px]"
        onClick={onContinue}
      />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="moderation-approved-title"
        aria-describedby="moderation-approved-desc"
        className="relative w-full max-w-md rounded-2xl border border-emerald-200 bg-white p-5 shadow-xl sm:p-6"
      >
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2
              className="h-8 w-8 text-emerald-700"
              aria-hidden="true"
            />
          </div>

          <h2
            id="moderation-approved-title"
            className="mt-4 text-xl font-semibold text-gray-900"
          >
            {MODERATION_APPROVED_UI.title}
          </h2>

          <p
            id="moderation-approved-desc"
            className="mt-2 text-sm text-gray-600"
          >
            {isEdit
              ? MODERATION_APPROVED_UI.introEdit
              : MODERATION_APPROVED_UI.intro}
          </p>
        </div>

        <button
          ref={continueButtonRef}
          type="button"
          onClick={onContinue}
          className="mt-6 flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          {MODERATION_APPROVED_UI.continueLabel}
        </button>
      </div>
    </div>
  );
}
