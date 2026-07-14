/**
 * Sdílené UI primitivy — jediný zdroj Tailwind tříd pro opakující se prvky.
 * Dokumentace: docs/ui-prvky.md
 */

/** Zelený povrch: barva, čistý stín, hover. Bez ring/glow kromě focus-visible. */
export const emeraldSurfaceClass =
  "bg-emerald-600 text-white shadow-md shadow-emerald-900/10 transition hover:bg-emerald-700";

export const emeraldFocusRingClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500";

/** Primární zelené CTA — rounded-xl (formuláře, modály, dialogy). */
export const emeraldPrimaryButtonClass =
  `rounded-xl font-semibold ${emeraldSurfaceClass} ${emeraldFocusRingClass}`;

/** Kompaktní zelené CTA — akční řádek modálů. */
export const emeraldPrimaryButtonCompactClass =
  `${emeraldPrimaryButtonClass} px-4 py-2 text-sm`;

/** Header CTA povrch — flat zelená shodná s logem zaPikolou, hover ztmaví jako logo. */
export const headerCreateListingSurfaceClass =
  "bg-emerald-600 text-white transition-colors duration-200 hover:bg-emerald-700";

/** Sdílený text hlavního CTA pro tvorbu inzerátu (header + FAB). */
export const createListingCtaLabel = "Vytvořit inzerát s AI";

/** Výška vyhledávače a loga v headeru (`HeaderSearch` input). */
export const headerInputHeightClass = "h-10";

/** Výška a horizontální padding header CTA (logo má vlastní rozměry). */
export const headerBrandControlHeightClass = "h-11";
export const headerBrandControlPaddingXClass = "px-6";

/** Header „Vytvořit inzerát s AI“ — jen desktop (md+), pill s textem, ikona Sparkles. */
export const headerCreateListingButtonClass =
  `hidden ${headerBrandControlHeightClass} shrink-0 items-center justify-center whitespace-nowrap rounded-full ${headerBrandControlPaddingXClass} text-[0.9375rem] font-semibold md:flex ${headerCreateListingSurfaceClass} ${emeraldFocusRingClass}`;

/** Mobilní FAB pro tvorbu inzerátu — plovoucí, extended → ikona při scrollu. */
export const createListingFabClass =
  `fixed right-4 z-[95] flex h-14 items-center justify-center whitespace-nowrap rounded-full text-sm font-semibold shadow-lg shadow-emerald-900/20 md:hidden ${headerCreateListingSurfaceClass} ${emeraldFocusRingClass}`;

/** Primární brand zelená — logo wordmark, shodná s `headerCreateListingSurfaceClass`. */
export const emeraldBrandAccentClass = "text-emerald-600";

/** Logo zaPikolou.cz — výška jako vyhledávač, wordmark bez rámečku. */
export const appLogoFrameClass =
  `inline-flex shrink-0 ${headerInputHeightClass} items-center whitespace-nowrap font-sans text-lg leading-none tracking-tight select-none ${emeraldBrandAccentClass}`;

/** Modální overlay — centrovaný dialog nad stránkou. */
export const modalOverlayClass =
  "fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 p-4";

/** Modální panel — bílá karta uprostřed overlaye. */
export const modalPanelClass =
  "w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-xl shadow-gray-900/10";

/** Zrušit v modálu — textové tlačítko bez rámečku. */
export const modalCancelGhostButtonClass =
  "rounded-xl px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50";

/** Zrušit v modálu — s rámečkem (destruktivní dialogy). */
export const modalCancelOutlineButtonClass =
  "rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50";

/** Destruktivní potvrzení v modálu (smazání účtu apod.). */
export const modalDangerButtonClass =
  "rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700";

/** Pilulka kategorie na homepage — aktivní (fixní gradient hero). */
export const homeCategoryTabActiveClass =
  "border-slate-900 bg-slate-900 text-white shadow-sm";

/** Pilulka kategorie na homepage — neaktivní. */
export const homeCategoryTabInactiveClass =
  "border border-white/20 bg-white/90 text-slate-800 shadow-sm backdrop-blur-sm transition-colors hover:bg-white hover:text-slate-900";

/** Ikona v pilulce / tlačítku — 16px, barvu dědí z rodiče. */
export const iconSmClass = "h-4 w-4";
