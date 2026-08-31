"use client";

import {
  LISTING_SHARE_UI,
  listingSharePhotoOverlayButtonClass,
} from "@/config/listing-share";
import { GTM_CTA, gtmCtaProps } from "@/config/gtm-ids";
import {
  modalCancelOutlineButtonClass,
  modalOverlayClass,
  modalPanelClass,
} from "@/config/ui-primitives";
import { Share2 } from "lucide-react";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import type QRCodeStyling from "qr-code-styling";

type ShareListingButtonProps = {
  pageUrl: string;
  title: string;
};

const QR_PREVIEW_PX = 192;
const QR_DOWNLOAD_PX = 512;

function listingQrFileName(pageUrl: string): string {
  try {
    const slug = new URL(pageUrl).pathname.replace(/\/+$/, "").split("/").pop();
    if (slug) return `zapikolou-${slug}`;
  } catch {
    /* ignore */
  }
  return "zapikolou-inzerat";
}

export function ShareListingButton({
  pageUrl,
  title,
}: ShareListingButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [qrReady, setQrReady] = useState(false);
  const qrContainerRef = useRef<HTMLDivElement>(null);
  const qrRef = useRef<QRCodeStyling | null>(null);

  useEffect(() => {
    setCanNativeShare(
      typeof navigator !== "undefined" && typeof navigator.share === "function",
    );
  }, []);

  useEffect(() => {
    if (!open) return;

    const container = qrContainerRef.current;
    if (!container) return;

    let cancelled = false;
    container.replaceChildren();
    qrRef.current = null;
    setQrReady(false);

    void import("qr-code-styling").then((mod) => {
      if (cancelled || !qrContainerRef.current) return;
      const QRCodeStyling = mod.default;
      const qr = new QRCodeStyling({
        width: QR_DOWNLOAD_PX,
        height: QR_DOWNLOAD_PX,
        type: "svg",
        data: pageUrl,
        qrOptions: { errorCorrectionLevel: "M" },
        dotsOptions: { type: "square", color: "#111827" },
        backgroundOptions: { color: "#ffffff" },
      });
      qrRef.current = qr;
      qr.append(qrContainerRef.current);
      setQrReady(true);
    });

    return () => {
      cancelled = true;
      qrRef.current = null;
      container.replaceChildren();
    };
  }, [open, pageUrl]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setCopyError(null);
    } catch {
      setCopied(false);
      setCopyError(LISTING_SHARE_UI.copyFailed);
    }
  }

  async function nativeShare() {
    try {
      await navigator.share({ title, url: pageUrl });
    } catch {
      /* uživatel zrušil nebo share není dostupný */
    }
  }

  async function downloadQr() {
    const qr = qrRef.current;
    if (!qr) return;
    await qr.download({
      name: listingQrFileName(pageUrl),
      extension: "png",
    });
  }

  function openDialog(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    setOpen(true);
    setCopied(false);
    setCopyError(null);
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        {...gtmCtaProps(GTM_CTA.DETAIL_SHARE_LISTING)}
        className={listingSharePhotoOverlayButtonClass}
        aria-label={LISTING_SHARE_UI.buttonLabel}
      >
        <Share2 className="h-4 w-4" aria-hidden="true" />
      </button>

      {open ? (
        <div className={modalOverlayClass} role="dialog" aria-modal="true">
          <div className={modalPanelClass}>
            <h3 className="text-lg font-semibold text-gray-900">
              {LISTING_SHARE_UI.dialogTitle}
            </h3>

            <div className="mt-4 flex flex-col items-center gap-3">
              <div
                ref={qrContainerRef}
                className="flex items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-white [&_canvas]:h-48 [&_canvas]:w-48 [&_svg]:h-48 [&_svg]:w-48"
                style={{ width: QR_PREVIEW_PX, height: QR_PREVIEW_PX }}
                aria-label={LISTING_SHARE_UI.qrLabel}
              />
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              {canNativeShare ? (
                <button
                  type="button"
                  onClick={() => void nativeShare()}
                  className={modalCancelOutlineButtonClass}
                >
                  {LISTING_SHARE_UI.nativeShare}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => void copyLink()}
                className={modalCancelOutlineButtonClass}
              >
                {copied ? LISTING_SHARE_UI.copied : LISTING_SHARE_UI.copyLink}
              </button>
              <button
                type="button"
                onClick={() => void downloadQr()}
                disabled={!qrReady}
                className={modalCancelOutlineButtonClass}
              >
                {LISTING_SHARE_UI.downloadQr}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className={modalCancelOutlineButtonClass}
              >
                {LISTING_SHARE_UI.close}
              </button>
            </div>
            {copyError ? (
              <p className="mt-2 text-sm text-red-600">{copyError}</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
