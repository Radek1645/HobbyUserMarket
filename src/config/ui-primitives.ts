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

/** Header CTA povrch — flat zelená shodná s logem HUM, hover ztmaví jako logo. */
export const headerCreateListingSurfaceClass =
  "bg-emerald-600 text-white transition-colors duration-200 hover:bg-emerald-700";

/** Header „Vytvořit inzerát přes AI“ — pill na mobilu, text od 480px, ikona Sparkles. */
export const headerCreateListingButtonClass =
  `flex h-10 w-10 shrink-0 items-center justify-center rounded-full p-0 text-sm font-semibold ${headerCreateListingSurfaceClass} ${emeraldFocusRingClass} sm:h-11 sm:w-auto sm:px-4 sm:text-[0.9375rem] md:px-6`;

/** Logo mark (domeček vlevo v headeru). */
export const emeraldLogoMarkClass =
  `flex h-10 w-10 items-center justify-center rounded-xl ${emeraldSurfaceClass}`;

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
