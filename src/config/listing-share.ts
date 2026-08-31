/** Copy tlačítka Sdílet na detailu inzerátu. */

export const LISTING_SHARE_UI = {
  buttonLabel: "Sdílet",
  dialogTitle: "Sdílet inzerát",
  copyLink: "Kopírovat odkaz",
  copied: "Odkaz zkopírovaný",
  copyFailed: "Odkaz se nepodařilo zkopírovat.",
  nativeShare: "Sdílet…",
  qrLabel: "QR kód",
  downloadQr: "Stáhnout QR",
  close: "Zavřít",
} as const;

/** Kolečko sdílení přes roh úvodní fotky. */
export const listingSharePhotoOverlayButtonClass =
  "absolute top-3 right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-900 shadow-md ring-1 ring-black/10 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900";
