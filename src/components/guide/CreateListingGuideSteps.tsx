"use client";

import {
  CreateListingGuideStep1Screen,
  CreateListingGuideStep2Screen,
  CreateListingGuideStep3Screen,
  CreateListingGuideStep4Screen,
} from "@/components/guide/CreateListingGuideScreens";
import {
  CREATE_LISTING_GUIDE_DEFAULT_DEMO_ID,
  CREATE_LISTING_GUIDE_DEMOS,
  CREATE_LISTING_GUIDE_UI,
  getCreateListingGuideDemo,
  type CreateListingGuideDemoId,
} from "@/config/create-listing-guide";
import {
  emeraldFocusRingClass,
  homeCategoryTabActiveClass,
  homeCategoryTabInactiveClass,
} from "@/config/ui-primitives";
import { useState } from "react";

const ui = CREATE_LISTING_GUIDE_UI;

export function CreateListingGuideSteps() {
  const [activeDemoId, setActiveDemoId] = useState<CreateListingGuideDemoId>(
    CREATE_LISTING_GUIDE_DEFAULT_DEMO_ID,
  );
  const demo = getCreateListingGuideDemo(activeDemoId);

  return (
    <div>
      <div className="mt-8">
        <p className="text-sm font-medium text-gray-700">
          {ui.scenariosLabel}
        </p>
        <div
          role="tablist"
          aria-label={ui.scenariosLabel}
          className="mt-3 flex flex-wrap gap-2"
        >
          {CREATE_LISTING_GUIDE_DEMOS.map((item) => {
            const isActive = item.id === activeDemoId;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveDemoId(item.id)}
                className={`inline-flex items-center rounded-full border px-3.5 py-2 text-sm font-medium ${emeraldFocusRingClass} ${
                  isActive
                    ? homeCategoryTabActiveClass
                    : homeCategoryTabInactiveClass
                }`}
              >
                {item.tabLabel}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-sm text-gray-600">{demo.hint}</p>
      </div>

      <ol className="mt-12 space-y-16 sm:space-y-20">
        {ui.steps.map((step, index) => {
          const screen =
            index === 0 ? (
              <CreateListingGuideStep1Screen demo={demo} />
            ) : index === 1 ? (
              <CreateListingGuideStep2Screen />
            ) : index === 2 ? (
              <CreateListingGuideStep3Screen demo={demo} />
            ) : (
              <CreateListingGuideStep4Screen demo={demo} />
            );

          return (
            <li
              key={step.number}
              className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-center lg:gap-12"
            >
              <div className={index % 2 === 1 ? "lg:order-2" : undefined}>
                <p className="text-sm font-semibold text-emerald-600">
                  Krok {step.number}
                </p>
                <h2 className="mt-1 text-xl font-semibold text-gray-900 sm:text-2xl">
                  {step.title}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-gray-600 sm:text-base">
                  {step.body}
                </p>
              </div>

              <div
                className={
                  index % 2 === 1
                    ? "flex justify-center lg:order-1 lg:justify-end"
                    : "flex justify-center lg:justify-start"
                }
              >
                {screen}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
