"use client";

import { LISTING_AI_DISCLOSURE } from "@/config/moderation/messages";
import { Info } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

export function ListingAiDisclosureInfo() {
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
    <span ref={rootRef} className="relative inline-flex">
      <button
        type="button"
        className="rounded-full text-gray-400 transition hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/35"
        aria-expanded={open}
        aria-controls={helpId}
        aria-label="Vysvětlení označení AI"
        onClick={() => setOpen((current) => !current)}
      >
        <Info className="h-3.5 w-3.5" aria-hidden />
      </button>

      {open ? (
        <span
          id={helpId}
          role="tooltip"
          className="absolute left-0 top-full z-20 mt-1.5 w-[min(18rem,calc(100vw-2rem))] rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs leading-relaxed text-gray-700 shadow-md"
        >
          {LISTING_AI_DISCLOSURE.paramHelp}
        </span>
      ) : null}
    </span>
  );
}
