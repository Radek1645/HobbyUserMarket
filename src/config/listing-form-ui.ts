import { emeraldPrimaryButtonClass } from "@/config/ui-primitives";

/** Sdílené třídy formuláře inzerátu — kontrast WCAG 2.1 AA */

export const listingFormInputClass =
  "mt-1 w-full rounded-xl border border-neutral-500 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none placeholder:text-neutral-600 focus:border-blue-700 focus:ring-2 focus:ring-blue-600/35";

export const listingFormLabelClass =
  "block text-sm font-semibold text-neutral-900";

/** Hvězdička u povinných polí — oddělená mezera, zarovnání, čitelná červená. */
export const listingFormRequiredMarkClass =
  "ml-[5px] inline-block select-none align-text-top text-[1.15em] font-bold leading-none text-[#e53e3e]";

export const LISTING_FORM_REQUIRED_LEGEND = "* Označená pole jsou povinná.";

/** Edit vlastního inzerátu — smazání je ve Správě inzerátů, ne ve formuláři. */
export const LISTING_FORM_DELETE_HINT = {
  beforeLink: "* Tip: inzerát smažete ve ",
  linkLabel: "Správě inzerátů",
  afterLink: " — otevřete horní menu a zvolte „Správa inzerátů“.",
  href: "/moje-inzeraty",
} as const;

/** Full-screen overlay při publikaci / uložení změn (CreateListingForm). */
export const LISTING_FORM_SAVING_UI = {
  title: "Ukládám inzerát…",
  titleEdit: "Ukládám změny…",
  hint: "Chvilku strpení — formulář nechte otevřený.",
} as const;

export const listingFormRequiredLegendClass =
  "mb-2 text-xs text-neutral-500";

export const listingFormHintClass = "mt-1 text-xs text-neutral-600";

/** Žlutý prstenec u polí, která AI prefill nevyplní (cena, stav, lokalita). */
export const listingFormPrefillHighlightClass =
  "rounded-xl ring-2 ring-amber-400/80 ring-offset-2";

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
  "rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 px-4 py-6 text-center text-sm text-neutral-700 transition-all duration-200 hover:border-neutral-600 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 cursor-pointer";

/** Dropzone při drag-over (soubor nad plochou). */
export const listingFormDropzoneActiveClass =
  "border-emerald-500 bg-emerald-50/30";

/** Aktivní krok v krokovníku create formuláře. */
export const listingFormStepActiveClass =
  "rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-800";

/** Neaktivní krok v krokovníku. */
export const listingFormStepInactiveClass = "font-normal text-slate-400";

/** Labely krokovníku — photo-first create (čísla 1–5). */
export const LISTING_FORM_STEPPER_PHOTO_FIRST = [
  "Fotky a předvyplnění",
  "Kategorie",
  "Obsah",
  "AI vylepšení",
  "Publikace",
] as const;

/** Labely krokovníku — ruční create / edit (čísla 1–4). */
export const LISTING_FORM_STEPPER_MANUAL = [
  "Kategorie",
  "Obsah",
  "AI vylepšení",
  "Publikace",
] as const;

/** Sekundární banner — ruční cesta (reality / služby / práce / události). */
export const listingFormManualBannerClass =
  "mt-2 flex flex-col items-start justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:p-5";

export const listingFormManualBannerButtonClass =
  "self-stretch rounded-lg border border-slate-300 bg-white px-4 py-2 text-center text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 sm:self-auto whitespace-nowrap disabled:pointer-events-none disabled:opacity-50";
