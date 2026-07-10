import { emeraldPrimaryButtonClass } from "@/config/ui-primitives";

/** Sdílené třídy formuláře inzerátu — kontrast WCAG 2.1 AA */

export const listingFormInputClass =
  "mt-1 w-full rounded-xl border border-neutral-500 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none placeholder:text-neutral-600 focus:border-blue-700 focus:ring-2 focus:ring-blue-600/35";

export const listingFormLabelClass =
  "block text-sm font-semibold text-neutral-900";

export const listingFormHintClass = "mt-1 text-xs text-neutral-600";

export const listingFormCardClass =
  "space-y-4 rounded-2xl border border-neutral-300 bg-white p-4 shadow-sm sm:p-6";

export const listingFormCategoryBarClass =
  "flex flex-wrap items-center justify-between gap-2 rounded-xl border border-neutral-200 bg-neutral-100 px-3 py-2.5 text-sm text-neutral-900";

export const listingFormSettingsClass =
  "rounded-xl border border-neutral-300 bg-neutral-50 p-4";

export const listingFormContactSectionClass =
  "space-y-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 sm:p-5";

export const listingFormContactOptionBaseClass =
  "flex cursor-pointer items-start gap-3 rounded-xl border bg-white p-3 transition-colors sm:p-4";

export const listingFormContactOptionActiveClass =
  "border-blue-600 bg-blue-50/70 ring-1 ring-blue-600/25";

export const listingFormContactOptionIdleClass =
  "border-neutral-200 hover:border-neutral-300";

export const listingFormSecondaryButtonClass =
  "flex items-center justify-center gap-2 rounded-xl border border-neutral-500 bg-white px-4 py-3 text-sm font-medium text-neutral-900 transition hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

export const listingFormPrimaryButtonClass =
  `flex items-center justify-center px-4 py-3 text-sm ${emeraldPrimaryButtonClass} focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-neutral-400 disabled:text-white disabled:shadow-none`;

/** Poptávka / napsat prodejci — vždy černé, full-width (detail inzerátu). */
export const listingInquiryCtaButtonClass =
  "flex w-full items-center justify-center rounded-xl bg-gray-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

export const listingFormDropzoneClass =
  "rounded-xl border-2 border-dashed border-neutral-500 bg-neutral-50 px-4 py-6 text-center text-sm text-neutral-700 transition hover:border-neutral-600 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2";
