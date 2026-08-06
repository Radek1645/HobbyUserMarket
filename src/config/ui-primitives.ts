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

/**
 * Header „Vytvořit inzerát s AI“.
 * Od `sm` vždy; pod `sm` jen když je viewport nízký (FAB skrytý kvůli zoomu),
 * ať na telefonu nepřekrývá vyhledávání.
 */
export const headerCreateListingButtonClass =
  `hidden ${headerBrandControlHeightClass} shrink-0 items-center justify-center whitespace-nowrap rounded-full px-3 text-[0.9375rem] font-semibold sm:inline-flex sm:px-6 [@media(max-height:36rem)]:!inline-flex ${headerCreateListingSurfaceClass} ${emeraldFocusRingClass}`;

/** Text header CTA — na úzkém/zoomed viewportu jen ikona + aria-label. */
export const headerCreateListingLabelClass = "ml-2 hidden min-[480px]:inline";

/**
 * Mobilní FAB — jen úzký a dostatečně vysoký viewport.
 * Skrytý od `sm` a při nízké výšce (desktop + 150–200 % zoom).
 */
export const createListingFabClass =
  `fixed right-4 z-[95] hidden h-14 items-center justify-center whitespace-nowrap rounded-full text-sm font-semibold shadow-lg shadow-emerald-900/20 max-sm:flex [@media(max-height:36rem)]:!hidden ${headerCreateListingSurfaceClass} ${emeraldFocusRingClass}`;

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

/** Řádek kategorií na HP — horizontální scroll s viditelným tenkým posuvníkem. */
export const homeCategoryNavClass =
  "mt-6 flex gap-2 overflow-x-auto overscroll-x-contain pb-2 touch-pan-x " +
  "[scrollbar-width:thin] [scrollbar-color:rgb(148_163_184_/_0.9)_transparent] " +
  "[&::-webkit-scrollbar]:h-1.5 " +
  "[&::-webkit-scrollbar-track]:bg-transparent " +
  "[&::-webkit-scrollbar-thumb]:rounded-full " +
  "[&::-webkit-scrollbar-thumb]:bg-slate-400/80 " +
  "[&::-webkit-scrollbar-thumb]:hover:bg-slate-500";

/** Pilulka kategorie na homepage — aktivní (fixní gradient hero). */
export const homeCategoryTabActiveClass =
  "border-slate-900 bg-slate-900 text-white shadow-sm";

/** Pilulka kategorie na homepage — neaktivní. */
export const homeCategoryTabInactiveClass =
  "border border-white/20 bg-white/90 text-slate-800 shadow-sm backdrop-blur-sm transition-colors hover:bg-white hover:text-slate-900";

/** Ikona v pilulce / tlačítku — 16px, barvu dědí z rodiče. */
export const iconSmClass = "h-4 w-4";

/** Dlaždice v mřížce kategorií — neaktivní. */
export const homeCategoryGridTileClass =
  "flex min-h-[2.75rem] w-full items-center gap-2 rounded-xl border border-white/25 bg-white/90 px-3 py-2.5 text-left text-sm font-medium text-slate-800 shadow-sm backdrop-blur-sm transition-colors hover:bg-white hover:text-slate-900";

/** Dlaždice v mřížce kategorií — aktivní. */
export const homeCategoryGridTileActiveClass =
  "flex min-h-[2.75rem] w-full items-center gap-2 rounded-xl border border-slate-900 bg-slate-900 px-3 py-2.5 text-left text-sm font-medium text-white shadow-sm";

/** Varianta mřížky mimo hero (formulář) — neaktivní. */
export const categoryGridTilePlainClass =
  "flex min-h-[2.75rem] w-full items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-left text-sm font-medium text-gray-800 transition-colors hover:border-gray-300 hover:bg-gray-50";

/** Varianta mřížky mimo hero — aktivní. */
export const categoryGridTilePlainActiveClass =
  "flex min-h-[2.75rem] w-full items-center gap-2 rounded-xl border border-gray-900 bg-gray-900 px-3 py-2.5 text-left text-sm font-medium text-white";

/** Štítek směru na kartě inzerátu — nabízím službu. */
export const listingIntentOfferBadgeClass =
  "inline-block max-w-full truncate rounded-full bg-emerald-700 px-2 py-0.5 text-[11px] font-medium text-white shadow-sm";

/** Štítek směru na kartě inzerátu — hledám člověka (práce/brigáda). */
export const listingIntentDemandBadgeClass =
  "inline-block max-w-full truncate rounded-full bg-slate-900 px-2 py-0.5 text-[11px] font-medium text-white shadow-sm";

/** Podkategorie na image-first kartě (vedle štítku směru). */
export const listingCardSubcategoryBadgeClass =
  "inline-block max-w-full truncate rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-medium text-gray-800 shadow-sm";

/** Štítek Podnikatel (VOP §7.2) — solidní, hned odlišný od milníků. */
export const advertiserPodnikatelBadgeClass =
  "inline-flex items-center rounded-full bg-slate-900 px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-sm";

const advertiserMilestoneBadgeBaseClass =
  "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset";

/** 5+ bronz · 10+ stříbro · 20+ zlato · 40+ platina */
export const advertiserMilestoneBadgeClassByThreshold = {
  5: `${advertiserMilestoneBadgeBaseClass} bg-amber-50 text-amber-900 ring-amber-200`,
  10: `${advertiserMilestoneBadgeBaseClass} bg-slate-100 text-slate-700 ring-slate-300`,
  20: `${advertiserMilestoneBadgeBaseClass} bg-yellow-50 text-yellow-900 ring-yellow-300`,
  40: `${advertiserMilestoneBadgeBaseClass} bg-violet-50 text-violet-900 ring-violet-200`,
} as const;
