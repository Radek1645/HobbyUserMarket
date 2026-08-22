"use client";

import { uploadGuestModerationImages } from "@/app/actions/guest-moderation";
import { TurnstileWidget, type TurnstileWidgetHandle } from "@/components/security/TurnstileWidget";
import { GTM_CTA, gtmCtaProps } from "@/config/gtm-ids";
import {
  LISTING_IMAGE_CAMERA_ACCEPT,
  LISTING_IMAGE_GALLERY_ACCEPT,
  LISTING_IMAGE_MAX_FILE_BYTES,
} from "@/config/app";
import { resolveTurnstileSiteKey } from "@/config/guest-listing";
import {
  listingFormDropzoneActiveClass,
  listingFormDropzoneClass,
  listingFormManualBannerButtonClass,
  listingFormManualBannerClass,
  listingFormPrimaryButtonClass,
  listingFormSecondaryButtonClass,
} from "@/config/listing-form-ui";
import {
  SUGGEST_FROM_PHOTOS_MAX_IMAGES,
  SUGGEST_FROM_PHOTOS_MIN_IMAGES,
  SUGGEST_FROM_PHOTOS_UI,
} from "@/config/suggest-from-photos";
import { compressListingImage } from "@/lib/images/compress-listing-image";
import { suggestListingFromPhotos } from "@/lib/listing/suggest-listing-client";
import {
  prepareModerationImages,
  type ModerationImageReference,
} from "@/lib/moderation/prepare-moderation-images";
import {
  validateListingImageFile,
  validateListingImageSourceFile,
} from "@/lib/posts/listing-images";
import type { CategoryType } from "@/types/post";
import { Camera, CloudUpload, ImageIcon, Loader2, Sparkles, X } from "lucide-react";
import { useCallback, useRef, useState, type ChangeEvent } from "react";

export type AiPrefillResult = {
  title: string;
  description: string;
  categoryType: CategoryType;
  subcategorySlug: string | null;
  files: File[];
  stagedPaths: string[];
  imageReferences: ModerationImageReference[];
};

type PrefillPhase = "idle" | "checking" | "analyzing" | "prefilling";

type AiListingPrefillEntryProps = {
  guestMode?: boolean;
  guestVisitorId?: string;
  guestVisitorToken?: string;
  guestSessionReady?: boolean;
  onPrefillSuccess: (result: AiPrefillResult) => void;
  onChooseManual: () => void;
};

type LocalPhoto = {
  key: string;
  file: File;
  previewUrl: string;
};

function phaseLabel(phase: PrefillPhase): string {
  switch (phase) {
    case "checking":
      return SUGGEST_FROM_PHOTOS_UI.statusChecking;
    case "analyzing":
      return SUGGEST_FROM_PHOTOS_UI.statusAnalyzing;
    case "prefilling":
      return SUGGEST_FROM_PHOTOS_UI.statusPrefilling;
    default:
      return "";
  }
}

export function AiListingPrefillEntry({
  guestMode = false,
  guestVisitorId,
  guestVisitorToken,
  guestSessionReady = true,
  onPrefillSuccess,
  onChooseManual,
}: AiListingPrefillEntryProps) {
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const turnstileWidgetRef = useRef<TurnstileWidgetHandle | null>(null);
  const turnstileTokenRef = useRef<string | null>(null);
  const submitLockRef = useRef(false);
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<PrefillPhase>("idle");
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const busy = phase !== "idle";
  const guestBlocked = guestMode && !guestSessionReady;
  const hasPhotos = photos.length >= SUGGEST_FROM_PHOTOS_MIN_IMAGES;

  const clearPhotos = useCallback(() => {
    setPhotos((prev) => {
      for (const photo of prev) {
        URL.revokeObjectURL(photo.previewUrl);
      }
      return [];
    });
  }, []);

  const addFiles = useCallback(async (incoming: FileList | File[]) => {
    setError(null);
    const allIncoming = Array.from(incoming);
    const next: LocalPhoto[] = [];

    for (const file of allIncoming) {
      const sourceError = validateListingImageSourceFile(file);
      if (sourceError) {
        setError(sourceError);
        continue;
      }

      let compressed: File;
      try {
        compressed = await compressListingImage(file);
      } catch (compressError) {
        setError(
          compressError instanceof Error
            ? compressError.message
            : "Zpracování fotky selhalo.",
        );
        continue;
      }

      const storedError = validateListingImageFile(compressed);
      if (storedError) {
        setError(storedError);
        continue;
      }

      if (compressed.size > LISTING_IMAGE_MAX_FILE_BYTES) {
        setError("Fotka je po kompresi stále příliš velká.");
        continue;
      }

      next.push({
        key: `n:${crypto.randomUUID()}`,
        file: compressed,
        previewUrl: URL.createObjectURL(compressed),
      });
    }

    if (next.length === 0) return;

    // Mobil foťák typicky vrací 1 soubor — přidej k existujícím, drž poslední 2.
    let truncated = false;
    setPhotos((prev) => {
      const combined = [...prev, ...next];
      truncated =
        combined.length > SUGGEST_FROM_PHOTOS_MAX_IMAGES ||
        allIncoming.length > SUGGEST_FROM_PHOTOS_MAX_IMAGES;
      const kept = combined.slice(-SUGGEST_FROM_PHOTOS_MAX_IMAGES);
      const keptKeys = new Set(kept.map((photo) => photo.key));
      for (const photo of combined) {
        if (!keptKeys.has(photo.key)) {
          URL.revokeObjectURL(photo.previewUrl);
        }
      }
      return kept;
    });

    if (truncated) {
      setError(SUGGEST_FROM_PHOTOS_UI.tooManyPhotos);
    }
  }, []);

  function consumeTurnstileToken() {
    turnstileTokenRef.current = null;
    setTurnstileToken(null);
    turnstileWidgetRef.current?.reset();
  }

  async function prepareImageReferences(
    currentPhotos: LocalPhoto[],
  ): Promise<{
    imageReferences: ModerationImageReference[];
    stagedPaths: string[];
  } | null> {
    if (guestMode) {
      const formData = new FormData();
      for (const photo of currentPhotos) {
        formData.append("file", photo.file);
        formData.append("clientKey", photo.key);
      }
      const uploaded = await uploadGuestModerationImages(formData);
      if (!uploaded.ok) {
        if (uploaded.captchaRequired) {
          setShowCaptcha(true);
        }
        setError(uploaded.error);
        return null;
      }
      const byKey = new Map(
        uploaded.items.map((item) => [item.clientKey, item] as const),
      );
      const imageReferences: ModerationImageReference[] = [];
      const stagedPaths: string[] = [];
      for (const photo of currentPhotos) {
        const item = byKey.get(photo.key);
        if (!item) {
          setError(SUGGEST_FROM_PHOTOS_UI.technicalError);
          return null;
        }
        imageReferences.push(item.reference);
        stagedPaths.push(item.storagePath);
      }
      return { imageReferences, stagedPaths };
    }

    const sources = currentPhotos.map((photo) => ({
      kind: "file" as const,
      key: photo.key,
      file: photo.file,
    }));
    const prepared = await prepareModerationImages(sources, 0);
    if (!prepared?.payload.imageReferences.length) {
      setError(SUGGEST_FROM_PHOTOS_UI.technicalError);
      return null;
    }
    return {
      imageReferences: prepared.payload.imageReferences,
      stagedPaths: currentPhotos.map(
        (photo) => prepared.stagedPathsByKey[photo.key] ?? "",
      ),
    };
  }

  async function handleSubmit() {
    if (submitLockRef.current || busy || guestBlocked) {
      return;
    }

    if (photos.length < SUGGEST_FROM_PHOTOS_MIN_IMAGES) {
      setError(SUGGEST_FROM_PHOTOS_UI.needPhotos);
      return;
    }

    if (guestMode && showCaptcha && !turnstileToken) {
      setError("Potvrďte, že nejste robot, a zkuste to znovu.");
      return;
    }

    submitLockRef.current = true;
    setError(null);
    setPhase("checking");

    try {
      const prepared = await prepareImageReferences(photos);
      if (!prepared) {
        setPhase("idle");
        return;
      }

      setPhase("analyzing");
      const suggestion = await suggestListingFromPhotos({
        imageReferences: prepared.imageReferences,
        guestVisitorId: guestMode ? guestVisitorId : undefined,
        guestVisitorToken: guestMode ? guestVisitorToken : undefined,
        turnstileToken: guestMode ? turnstileToken : undefined,
      });

      if (!suggestion.ok) {
        if (suggestion.kind === "captcha_required") {
          setShowCaptcha(true);
          consumeTurnstileToken();
        }
        setError(suggestion.message);
        setPhase("idle");
        return;
      }

      if (guestMode && turnstileToken) {
        consumeTurnstileToken();
      }

      setPhase("prefilling");
      onPrefillSuccess({
        title: suggestion.title,
        description: suggestion.description,
        categoryType: suggestion.categoryType,
        subcategorySlug: suggestion.subcategorySlug,
        files: photos.map((photo) => photo.file),
        stagedPaths: prepared.stagedPaths,
        imageReferences: prepared.imageReferences,
      });
      clearPhotos();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : SUGGEST_FROM_PHOTOS_UI.technicalError,
      );
    } finally {
      submitLockRef.current = false;
      setPhase("idle");
    }
  }

  function removePhoto(key: string) {
    setPhotos((prev) => {
      const target = prev.find((photo) => photo.key === key);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((photo) => photo.key !== key);
    });
  }

  function handleFileInputChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files?.length) {
      void addFiles(event.target.files);
    }
    event.target.value = "";
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-neutral-300 bg-white p-5 shadow-sm sm:p-8">
        <div className="mx-auto flex max-w-lg flex-col items-center text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 p-3 text-emerald-600">
            <Sparkles className="h-5 w-5" aria-hidden />
          </span>
          <h2 className="mt-4 text-xl font-semibold text-neutral-900">
            {SUGGEST_FROM_PHOTOS_UI.aiCardTitle}
          </h2>
          <p className="mt-2 text-sm text-neutral-600">
            {SUGGEST_FROM_PHOTOS_UI.aiCardSubtitle}
          </p>
        </div>

        <input
          ref={galleryInputRef}
          type="file"
          accept={LISTING_IMAGE_GALLERY_ACCEPT}
          multiple
          className="sr-only"
          disabled={busy || guestBlocked}
          onChange={handleFileInputChange}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept={LISTING_IMAGE_CAMERA_ACCEPT}
          capture="environment"
          className="sr-only"
          disabled={busy || guestBlocked}
          onChange={handleFileInputChange}
        />

        {/* Mobil — foťák zvlášť, jinak Android otevře jen galerii. */}
        <div className="mt-6 space-y-2 sm:hidden">
          <button
            type="button"
            disabled={busy || guestBlocked}
            onClick={() => cameraInputRef.current?.click()}
            className={`flex w-full ${listingFormSecondaryButtonClass} py-3.5`}
          >
            <Camera className="h-5 w-5" aria-hidden />
            {SUGGEST_FROM_PHOTOS_UI.cameraCta}
          </button>
          <button
            type="button"
            disabled={busy || guestBlocked}
            onClick={() => galleryInputRef.current?.click()}
            className={`flex w-full ${listingFormSecondaryButtonClass} border-dashed py-3`}
          >
            <ImageIcon className="h-4 w-4" aria-hidden />
            {SUGGEST_FROM_PHOTOS_UI.galleryCta}
          </button>
          <p className="text-center text-xs text-neutral-600">
            {SUGGEST_FROM_PHOTOS_UI.dropzoneHint}
          </p>
        </div>

        <button
          type="button"
          disabled={busy || guestBlocked}
          onClick={() => galleryInputRef.current?.click()}
          onDragEnter={(event) => {
            event.preventDefault();
            if (busy || guestBlocked) return;
            setDragActive(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            if (busy || guestBlocked) return;
            setDragActive(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setDragActive(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setDragActive(false);
            if (busy || guestBlocked) return;
            if (event.dataTransfer.files?.length) {
              void addFiles(event.dataTransfer.files);
            }
          }}
          className={`mt-6 hidden w-full sm:block ${listingFormDropzoneClass} ${
            dragActive ? listingFormDropzoneActiveClass : ""
          } disabled:cursor-not-allowed disabled:opacity-60`}
        >
          <span className="mx-auto flex items-center justify-center gap-3 text-neutral-500">
            <Camera className="h-8 w-8" aria-hidden />
            <CloudUpload className="h-8 w-8" aria-hidden />
          </span>
          <p className="mt-2 font-medium text-neutral-800">
            {SUGGEST_FROM_PHOTOS_UI.dropzoneIdle}
          </p>
          <p className="mt-1 text-xs text-neutral-600">
            {SUGGEST_FROM_PHOTOS_UI.dropzoneHint}
          </p>
        </button>

        {photos.length > 0 ? (
          <ul className="mt-4 grid grid-cols-2 gap-3">
            {photos.map((photo, index) => (
              <li
                key={photo.key}
                className="relative overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50"
              >
                <img
                  src={photo.previewUrl}
                  alt={index === 0 ? "Hlavní fotka" : "Detail"}
                  className="aspect-square w-full object-cover"
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => removePhoto(photo.key)}
                  className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white disabled:pointer-events-none disabled:opacity-50"
                  aria-label="Odstranit fotku"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {error ? (
          <p
            className={
              error === SUGGEST_FROM_PHOTOS_UI.tooManyPhotos
                ? "mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950"
                : "mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
            }
            role="alert"
          >
            {error}
          </p>
        ) : null}

        {guestMode && showCaptcha && resolveTurnstileSiteKey() ? (
          <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
            <p className="mb-2 text-xs text-neutral-600">
              Ochrana proti zneužití — potvrďte, že nejste robot.
            </p>
            <TurnstileWidget
              ref={turnstileWidgetRef}
              onToken={(token) => {
                turnstileTokenRef.current = token;
                setTurnstileToken(token);
              }}
            />
          </div>
        ) : null}

        <div className="mt-6" aria-live="polite">
          {hasPhotos ? (
            <button
              type="button"
              {...gtmCtaProps(GTM_CTA.CREATE_AI_PREFILL)}
              disabled={
                busy ||
                guestBlocked ||
                (guestMode && showCaptcha && !turnstileToken)
              }
              onClick={() => void handleSubmit()}
              className={`flex w-full items-center justify-center gap-2 ${listingFormPrimaryButtonClass} disabled:pointer-events-none`}
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Sparkles className="h-4 w-4" aria-hidden />
              )}
              {busy ? phaseLabel(phase) : SUGGEST_FROM_PHOTOS_UI.ctaLabel}
            </button>
          ) : null}
        </div>
      </div>

      <div className={listingFormManualBannerClass}>
        <div>
          <h3 className="text-sm font-semibold text-slate-800">
            {SUGGEST_FROM_PHOTOS_UI.manualTitle}
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            {SUGGEST_FROM_PHOTOS_UI.manualBody}
          </p>
        </div>
        <button
          type="button"
          {...gtmCtaProps(GTM_CTA.CREATE_MANUAL_ENTRY)}
          disabled={busy}
          onClick={onChooseManual}
          className={listingFormManualBannerButtonClass}
        >
          {SUGGEST_FROM_PHOTOS_UI.manualCtaLabel}
        </button>
      </div>
    </div>
  );
}
