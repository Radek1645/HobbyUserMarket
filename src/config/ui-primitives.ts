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

/**
 * Preferovaná akce v páru (ne hlavní zelené CTA stránky).
 * Světlý emerald podklad, plný rámeček — navede, aniž by konkurovalo „Vytvořit inzerát“.
 */
export const preferredSoftButtonClass =
  "flex items-center justify-center gap-2 rounded-xl border border-emerald-600 bg-emerald-50 px-4 py-3.5 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

/**
 * Záložní akce v páru s `preferredSoftButtonClass`.
 * Bílé, čárkovaný rámeček, běžná váha písma.
 */
export const secondaryDashedButtonClass =
  "flex items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-500 bg-white px-4 py-3 text-sm font-medium text-neutral-900 transition hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

/** Header CTA povrch — flat zelená shodná s `Pikolou` ve wordmarku, hover ztmaví. */
export const headerCreateListingSurfaceClass =
  "bg-emerald-600 text-white transition-colors duration-200 hover:bg-emerald-700";

/** Sdílený text hlavního CTA pro tvorbu inzerátu (header + FAB). */
export const createListingCtaLabel = "Vytvořit inzerát";

/** Výška vyhledávače a loga v headeru (`HeaderSearch` input). */
export const headerInputHeightClass = "h-10";

/** Výška a horizontální padding header CTA (logo má vlastní rozměry). */
export const headerBrandControlHeightClass = "h-11";
export const headerBrandControlPaddingXClass = "px-6";

/**
 * Header „Vytvořit inzerát“.
 * Od `sm` vždy; pod `sm` jen když je viewport nízký (FAB skrytý kvůli zoomu),
 * ať na telefonu nepřekrývá vyhledávání.
 */
export const headerCreateListingButtonClass =
  `hidden ${headerBrandControlHeightClass} shrink-0 items-center justify-center whitespace-nowrap rounded-full px-3 text-[0.9375rem] font-semibold sm:inline-flex sm:px-6 [@media(max-height:36rem)]:!inline-flex ${headerCreateListingSurfaceClass} ${emeraldFocusRingClass}`;

/** Text header CTA — na úzkém/zoomed viewportu jen ikona + aria-label. */
export const headerCreateListingLabelClass = "ml-2 hidden min-[480px]:inline";

/** FB landing — primární CTA v hero a závěru (pill, větší než header). */
export const landingPrimaryCtaClass = `inline-flex items-center justify-center rounded-full px-[34px] py-[18px] text-lg font-bold ${headerCreateListingSurfaceClass} ${emeraldFocusRingClass}`;

/** FB landing — CTA v lokální liště stránky. */
export const landingHeaderCtaClass = `inline-flex items-center justify-center rounded-full px-[22px] py-3 text-[15px] font-bold ${headerCreateListingSurfaceClass} ${emeraldFocusRingClass}`;

/** FB landing — sekundární outline pill (dětský bazar). */
export const landingSecondaryCtaClass = `inline-flex w-fit items-center justify-center rounded-full border-[1.5px] border-emerald-600 px-6 py-[13px] text-base font-bold text-emerald-800 transition hover:bg-emerald-50 ${emeraldFocusRingClass}`;

/**
 * Mobilní FAB — jen úzký a dostatečně vysoký viewport.
 * Skrytý od `sm` a při nízké výšce (desktop + 150–200 % zoom).
 */
export const createListingFabClass =
  `fixed right-4 z-[95] hidden h-14 items-center justify-center whitespace-nowrap rounded-full text-sm font-semibold shadow-lg shadow-emerald-900/20 max-sm:flex [@media(max-height:36rem)]:!hidden ${headerCreateListingSurfaceClass} ${emeraldFocusRingClass}`;

/** Primární brand zelená — `Pikolou` ve wordmarku a ikony. `!` přebije dědění barvy z odkazu. */
export const emeraldBrandAccentClass = "!text-emerald-600";

/** Logo ink — `za` ve wordmarku. */
export const appLogoInkClass = "!text-[#0C2A1B]";

/** Tlumené `.cz` ve wordmarku. */
export const appLogoTldClass = "!text-[#6B7F73]";

/** Logo zaPikolou.cz — výška jako vyhledávač, wordmark bez rámečku. */
export const appLogoFrameClass =
  `inline-flex shrink-0 ${headerInputHeightClass} items-center whitespace-nowrap font-sans text-lg leading-none tracking-tight select-none`;

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

/**
 * HP hero — skleněná pilulka „inzerce zdarma“ těsně nad H1.
 * Bílé sklo na gradientu; zelená jen u ikony (brand CTA), text slate-900 jako „Vše“.
 */
export const homeFreeQuotaBadgeClass =
  "mb-3 inline-flex w-fit items-center gap-2 rounded-full border border-black/10 bg-white/70 px-4 py-1.5 text-sm font-medium text-slate-900 shadow-sm backdrop-blur-[4px] transition hover:bg-white/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500";

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

/** Štítek soukromé události — jen odkaz, ne ve veřejném přehledu. */
export const listingPrivateEventBadgeClass =
  "inline-flex items-center rounded-full bg-violet-700 px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm";

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
