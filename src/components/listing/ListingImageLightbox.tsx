"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";

type ListingImageLightboxProps = {
  images: Array<{ id: string; url: string }>;
  activeIndex: number;
  title: string;
  onClose: () => void;
  onActiveIndexChange: (index: number) => void;
};

export function ListingImageLightbox({
  images,
  activeIndex,
  title,
  onClose,
  onActiveIndexChange,
}: ListingImageLightboxProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const touchStartX = useRef<number | null>(null);

  const goPrev = useCallback(() => {
    const next =
      activeIndex <= 0 ? images.length - 1 : activeIndex - 1;
    onActiveIndexChange(next);
  }, [activeIndex, images.length, onActiveIndexChange]);

  const goNext = useCallback(() => {
    const next =
      activeIndex >= images.length - 1 ? 0 : activeIndex + 1;
    onActiveIndexChange(next);
  }, [activeIndex, images.length, onActiveIndexChange]);

  useEffect(() => {
    closeButtonRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (images.length <= 1) return;
      if (event.key === "ArrowLeft") goPrev();
      if (event.key === "ArrowRight") goNext();
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [goNext, goPrev, images.length, onClose]);

  const active = images[activeIndex];
  if (!active) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label={`Galerie: ${title}`}
      onTouchStart={(event) => {
        touchStartX.current = event.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        if (touchStartX.current === null || images.length <= 1) return;
        const endX = event.changedTouches[0]?.clientX;
        if (endX === undefined) return;
        const delta = endX - touchStartX.current;
        if (Math.abs(delta) > 48) {
          if (delta > 0) goPrev();
          else goNext();
        }
        touchStartX.current = null;
      }}
    >
      <button
        type="button"
        aria-label="Zavřít galerii"
        className="absolute inset-0 bg-gray-950/95"
        onClick={onClose}
      />

      <div className="relative flex h-full min-h-0 flex-col pointer-events-none">
        <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-3 text-white pointer-events-auto">
          <p className="text-sm text-white/80">
            {activeIndex + 1} / {images.length}
          </p>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-white/90 transition hover:bg-white/10 hover:text-white"
            aria-label="Zavřít galerii"
          >
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 pb-4 sm:px-12 pointer-events-auto">
          {images.length > 1 ? (
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-black/40 p-2 text-white transition hover:bg-black/60 sm:block"
              aria-label="Předchozí fotka"
            >
              <ChevronLeft className="h-7 w-7" aria-hidden="true" />
            </button>
          ) : null}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={active.url}
            alt={`${title} — fotka ${activeIndex + 1}`}
            className="max-h-[calc(100vh-5rem)] max-w-full object-contain"
          />

          {images.length > 1 ? (
            <button
              type="button"
              onClick={goNext}
              className="absolute right-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-black/40 p-2 text-white transition hover:bg-black/60 sm:block"
              aria-label="Další fotka"
            >
              <ChevronRight className="h-7 w-7" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
