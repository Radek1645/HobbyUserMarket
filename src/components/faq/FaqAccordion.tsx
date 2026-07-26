"use client";

import { LegalLinkedText } from "@/components/legal/LegalLinkedText";
import type { FaqItem } from "@/config/faq";
import { ChevronDown } from "lucide-react";
import { useId, useState } from "react";

type FaqAccordionProps = {
  items: readonly FaqItem[];
};

export function FaqAccordion({ items }: FaqAccordionProps) {
  const baseId = useId();
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="mt-8 divide-y divide-gray-200 rounded-2xl border border-gray-200 bg-white">
      {items.map((item) => {
        const isOpen = openId === item.id;
        const panelId = `${baseId}-${item.id}-panel`;
        const buttonId = `${baseId}-${item.id}-button`;

        return (
          <div key={item.id} className="px-4 sm:px-5">
            <h2 className="text-base font-semibold text-gray-900">
              <button
                type="button"
                id={buttonId}
                className="flex w-full items-center justify-between gap-3 py-4 text-left transition hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/35"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() =>
                  setOpenId((current) => (current === item.id ? null : item.id))
                }
              >
                <span>{item.question}</span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-gray-500 transition ${
                    isOpen ? "rotate-180" : ""
                  }`}
                  aria-hidden
                />
              </button>
            </h2>
            {isOpen ? (
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                className="pb-4 text-sm leading-relaxed text-gray-700"
              >
                <LegalLinkedText text={item.answer} />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
