"use client";

import {
  LISTING_IMAGE_CAMERA_ACCEPT,
  LISTING_IMAGE_GALLERY_ACCEPT,
  LISTING_IMAGE_MAX_FILES,
  LISTING_IMAGE_MAX_FILE_BYTES,
  LISTING_IMAGE_MAX_SOURCE_BYTES,
  MODERATION_IMAGE_STAGING_BUCKET,
} from "@/config/app";
import { GTM_CTA, gtmCtaProps } from "@/config/gtm-ids";
import {
  listingFormCameraButtonClass,
  listingFormDropzoneClass,
  listingFormHintClass,
  listingFormLabelClass,
  listingFormSecondaryDashedButtonClass,
} from "@/config/listing-form-ui";
import { compressListingImage } from "@/lib/images/compress-listing-image";
import {
  listingImageUserError,
  LISTING_IMAGE_LIMIT_SKIPPED,
  prepareListingImageFiles,
  type ListingImagePrepareResult,
} from "@/lib/images/read-listing-image-file";
import { validateListingImageFile } from "@/lib/posts/listing-images";
import type { ModerationImagePayload } from "@/lib/moderation/prepare-moderation-images";
import {
  prepareModerationImages,
  type ModerationImageSource,
} from "@/lib/moderation/prepare-moderation-images";
import { uploadGuestModerationImages } from "@/app/actions/guest-moderation";
import type { ListingImagePreview } from "@/types/post";
import { Camera, ImageIcon, Loader2, Star, X } from "lucide-react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

export type ListingImageUploadHandle = {
  appendToFormData: (formData: FormData) => void;
  hasImageChanges: () => boolean;
  getModerationImages: () => Promise<ModerationImagePayload | null>;
  /** P12 — zvýrazní fotku podle 0-based indexu z AI zamítnutí. */
  highlightRejectedImage: (index: number) => void;
  getGuestStagingPaths: () => string[];
  getMainImageIndex: () => number;
  /** Naplní nové fotky po AI prefillu (včetně volitelných staging cest). */
  seedNewImages: (params: {
    files: File[];
    stagedPaths?: string[];
    mainIndex?: number;
  }) => Promise<void>;
};

type ImageItem =
  | {
      key: string;
      kind: "existing";
      id: string;
      url: string;
      storagePath: string;
    }
  | {
      key: string;
      kind: "new";
      file: File;
      previewUrl: string;
    };

type ListingImageUploadProps = {
  initialImages?: ListingImagePreview[];
  categoryType: string;
  subcategorySlug: string;
  guestMode?: boolean;
  /** Guest bootstrap / jiné blokování nahrávání. */
  disabled?: boolean;
};

export const ListingImageUpload = forwardRef<
  ListingImageUploadHandle,
  ListingImageUploadProps
>(function ListingImageUpload(
  {
    initialImages = [],
    categoryType,
    subcategorySlug,
    guestMode = false,
    disabled = false,
  },
  ref,
) {
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<ImageItem[]>(() =>
    initialImages
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((image) => ({
        key: `e:${image.id}`,
        kind: "existing" as const,
        id: image.id,
        url: image.url,
        storagePath: image.storagePath,
      })),
  );
  const [mainKey, setMainKey] = useState(() => {
    const main = initialImages.find((image) => image.isMain);
    return main ? `e:${main.id}` : initialImages[0] ? `e:${initialImages[0].id}` : "";
  });
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [highlightedKey, setHighlightedKey] = useState<string | null>(null);
  const uploadBlocked = isCompressing || disabled;
  const itemRefs = useRef<Map<string, HTMLLIElement>>(new Map());
  const stagedPathsRef = useRef<Map<string, string>>(new Map());
  const renditionSignatureRef = useRef<string | undefined>(undefined);

  const highlightRejectedImage = useCallback((index: number) => {
    const target = items[index];
    if (!target) return;
    setHighlightedKey(target.key);
    const node = itemRefs.current.get(target.key);
    node?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [items]);

  useEffect(() => {
    if (!mainKey && items.length > 0) {
      setMainKey(items[0]!.key);
    }
  }, [items, mainKey]);

  const appendToFormData = useCallback(
    (formData: FormData) => {
      formData.set("imageOrder", items.map((item) => item.key).join(","));
      formData.set("mainImageKey", mainKey || items[0]?.key || "");
      for (const id of removedIds) {
        formData.append("removedImageId", id);
      }
      for (const item of items) {
        if (item.kind === "new") {
          const stagingPath = stagedPathsRef.current.get(item.key);
          if (stagingPath) {
            formData.append("stagedImagePath", stagingPath);
          }
        }
      }
    },
    [items, mainKey, removedIds],
  );

  const hasImageChanges = useCallback(() => {
    if (removedIds.length > 0) return true;
    if (items.some((item) => item.kind === "new")) return true;

    const sortedInitial = [...initialImages].sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );
    const initialKeys = sortedInitial.map((image) => `e:${image.id}`);
    const currentExistingKeys = items
      .filter((item) => item.kind === "existing")
      .map((item) => item.key);

    if (initialKeys.join(",") !== currentExistingKeys.join(",")) {
      return true;
    }

    const initialMain = sortedInitial.find((image) => image.isMain);
    const initialMainKey = initialMain
      ? `e:${initialMain.id}`
      : sortedInitial[0]
        ? `e:${sortedInitial[0].id}`
        : "";
    const effectiveMainKey = mainKey || items[0]?.key || "";

    return initialMainKey !== effectiveMainKey;
  }, [initialImages, items, mainKey, removedIds]);

  const getModerationImages = useCallback(async () => {
    if (items.length === 0) {
      return null;
    }

    const mainIndex = Math.max(
      0,
      items.findIndex((item) => item.key === (mainKey || items[0]?.key)),
    );

    if (guestMode) {
      const pending: { key: string; file: File }[] = [];

      for (const item of items) {
        if (item.kind !== "new") {
          throw new Error("V hostovském režimu nahrajte nové fotky.");
        }
        if (!stagedPathsRef.current.has(item.key)) {
          pending.push({ key: item.key, file: item.file });
        }
      }

      if (pending.length > 0) {
        const formData = new FormData();
        for (const entry of pending) {
          formData.append("file", entry.file);
          formData.append("clientKey", entry.key);
        }
        const uploaded = await uploadGuestModerationImages(formData);
        if (!uploaded.ok) {
          throw new Error(uploaded.error);
        }

        for (const item of uploaded.items) {
          stagedPathsRef.current.set(item.clientKey, item.storagePath);
        }
      }

      const imageReferences = items.map((item) => {
        const storagePath = stagedPathsRef.current.get(item.key);
        if (!storagePath) {
          throw new Error("Fotku se nepodařilo připravit pro AI kontrolu.");
        }
        return {
          bucket: MODERATION_IMAGE_STAGING_BUCKET,
          storagePath,
        } as const;
      });

      return {
        imageReferences,
        mainImageIndex: Math.min(
          mainIndex,
          Math.max(imageReferences.length - 1, 0),
        ),
      };
    }

    const sources: ModerationImageSource[] = items.map((item) =>
      item.kind === "new"
        ? {
            kind: "file",
            key: item.key,
            file: item.file,
            stagingPath: stagedPathsRef.current.get(item.key),
          }
        : { kind: "stored", storagePath: item.storagePath },
    );

    const prepared = await prepareModerationImages(
      sources,
      mainIndex,
      renditionSignatureRef.current,
    );
    if (!prepared) return null;

    for (const [key, storagePath] of Object.entries(
      prepared.stagedPathsByKey,
    )) {
      stagedPathsRef.current.set(key, storagePath);
    }
    renditionSignatureRef.current = prepared.renditionSignature;

    return prepared.payload;
  }, [guestMode, items, mainKey]);

  const getGuestStagingPaths = useCallback(() => {
    return items
      .map((item) => stagedPathsRef.current.get(item.key))
      .filter((path): path is string => Boolean(path));
  }, [items]);

  const getMainImageIndex = useCallback(() => {
    if (items.length === 0) {
      return 0;
    }
    const index = items.findIndex(
      (item) => item.key === (mainKey || items[0]?.key),
    );
    return Math.max(0, index);
  }, [items, mainKey]);

  const seedNewImages = useCallback(
    async (params: {
      files: File[];
      stagedPaths?: string[];
      mainIndex?: number;
    }) => {
      const nextItems: ImageItem[] = [];
      stagedPathsRef.current = new Map();
      renditionSignatureRef.current = undefined;

      for (const [index, file] of params.files.entries()) {
        if (nextItems.length >= LISTING_IMAGE_MAX_FILES) break;
        const key = `n:${crypto.randomUUID()}`;
        nextItems.push({
          key,
          kind: "new",
          file,
          previewUrl: URL.createObjectURL(file),
        });
        const stagedPath = params.stagedPaths?.[index];
        if (stagedPath) {
          stagedPathsRef.current.set(key, stagedPath);
        }
      }

      // Zruš preview URL starých „new“ položek
      for (const item of items) {
        if (item.kind === "new") {
          URL.revokeObjectURL(item.previewUrl);
        }
      }

      setItems(nextItems);
      setRemovedIds([]);
      setError(null);
      const mainIdx = Math.min(
        Math.max(params.mainIndex ?? 0, 0),
        Math.max(nextItems.length - 1, 0),
      );
      setMainKey(nextItems[mainIdx]?.key ?? "");
    },
    [items],
  );

  useImperativeHandle(
    ref,
    () => ({
      appendToFormData,
      hasImageChanges,
      getModerationImages,
      highlightRejectedImage,
      getGuestStagingPaths,
      getMainImageIndex,
      seedNewImages,
    }),
    [
      appendToFormData,
      getGuestStagingPaths,
      getMainImageIndex,
      getModerationImages,
      hasImageChanges,
      highlightRejectedImage,
      seedNewImages,
    ],
  );

  async function consumePreparedFiles(prepared: ListingImagePrepareResult) {
    const nextItems = [...items];
    const skipped: string[] = [];

    for (const item of prepared.skipped) {
      skipped.push(
        item.error === LISTING_IMAGE_LIMIT_SKIPPED
          ? `${item.name} (limit fotek)`
          : `${item.name}: ${item.error}`,
      );
    }

    for (const file of prepared.files) {
      if (nextItems.length >= LISTING_IMAGE_MAX_FILES) {
        skipped.push(`${file.name} (limit fotek)`);
        continue;
      }

      let compressed: File;
      try {
        compressed = await compressListingImage(file);
      } catch (compressError) {
        skipped.push(`${file.name}: ${listingImageUserError(compressError)}`);
        continue;
      }

      const storedError = validateListingImageFile(compressed);
      if (storedError) {
        skipped.push(`${file.name}: ${storedError}`);
        continue;
      }

      nextItems.push({
        key: `n:${crypto.randomUUID()}`,
        kind: "new",
        file: compressed,
        previewUrl: URL.createObjectURL(compressed),
      });
    }

    setItems(nextItems);
    if (!mainKey && nextItems.length > 0) {
      setMainKey(nextItems[0]!.key);
    }
    if (skipped.length > 0) {
      setError(
        skipped.length === 1
          ? skipped[0]!
          : `Některé fotky jsme přeskočili: ${skipped.join("; ")}`,
      );
    }
  }

  async function processFiles(incoming: FileList | File[]) {
    setError(null);
    setIsCompressing(true);

    try {
      const remaining = Math.max(0, LISTING_IMAGE_MAX_FILES - items.length);
      const prepared = await prepareListingImageFiles(incoming, {
        maxKeep: remaining,
        keep: "first",
      });
      await consumePreparedFiles(prepared);
    } finally {
      setIsCompressing(false);
    }
  }

  function removeItem(key: string) {
    setError(null);
    const target = items.find((item) => item.key === key);
    if (!target) return;

    if (target.kind === "existing") {
      setRemovedIds((current) =>
        current.includes(target.id) ? current : [...current, target.id],
      );
    } else {
      URL.revokeObjectURL(target.previewUrl);
      stagedPathsRef.current.delete(target.key);
    }
    renditionSignatureRef.current = undefined;

    const nextItems = items.filter((item) => item.key !== key);
    setItems(nextItems);

    if (mainKey === key) {
      setMainKey(nextItems[0]?.key ?? "");
    }
  }

  function handleFileInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    if (!input.files?.length) return;
    const list = Array.from(input.files);
    void (async () => {
      setError(null);
      setIsCompressing(true);
      try {
        const remaining = Math.max(0, LISTING_IMAGE_MAX_FILES - items.length);
        const prepared = await prepareListingImageFiles(list, {
          maxKeep: remaining,
          keep: "first",
        });
        input.value = "";
        await consumePreparedFiles(prepared);
      } finally {
        setIsCompressing(false);
      }
    })();
  }

  const maxPhotoSizeMb = Math.round(LISTING_IMAGE_MAX_FILE_BYTES / (1024 * 1024));
  const maxSourceSizeMb = Math.round(
    LISTING_IMAGE_MAX_SOURCE_BYTES / (1024 * 1024),
  );

  return (
    <div className="space-y-3">
      <div>
        <span className={listingFormLabelClass}>Fotky</span>
        <div className={`${listingFormHintClass} space-y-1`}>
          <p>
            ⚡ <strong>Tip</strong>: Přidejte fotky, které nejlépe ukazují stav
            a detaily inzerované věci.
          </p>
          <p>
            📸 Max. {LISTING_IMAGE_MAX_FILES} fotek — vstup max. {maxSourceSizeMb}{" "}
            MB před zmenšením, výsledek do {maxPhotoSizeMb} MB.
          </p>
          <p>⭐ Hvězdičkou vyberte hlavní fotku.</p>
          <p>🛡️ Fotky před publikací zkontrolujeme pomocí AI.</p>
        </div>
      </div>

      {items.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((item) => {
            const preview = item.kind === "existing" ? item.url : item.previewUrl;
            const isMain = item.key === mainKey;

            return (
              <li
                key={item.key}
                ref={(node) => {
                  if (node) itemRefs.current.set(item.key, node);
                  else itemRefs.current.delete(item.key);
                }}
                className={`relative overflow-hidden rounded-xl border bg-neutral-50 ${
                  highlightedKey === item.key
                    ? "border-red-500 ring-2 ring-red-400"
                    : "border-neutral-400"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt=""
                  className="aspect-[4/3] w-full object-cover"
                />
                <div className="absolute inset-x-0 top-0 flex justify-between gap-1 p-1.5">
                  <button
                    type="button"
                    {...gtmCtaProps(GTM_CTA.LISTING_IMAGE_SET_MAIN)}
                    onClick={() => setMainKey(item.key)}
                    className={`rounded-lg p-1.5 shadow-sm transition ${
                      isMain
                        ? "bg-amber-400 text-amber-950"
                        : "bg-white/90 text-gray-600 hover:bg-white"
                    }`}
                    title={isMain ? "Hlavní fotka (náhled)" : "Nastavit jako hlavní náhled"}
                    aria-label={
                      isMain ? "Hlavní fotka (náhled)" : "Nastavit jako hlavní náhled"
                    }
                    aria-pressed={isMain}
                  >
                    <Star className="h-4 w-4" fill={isMain ? "currentColor" : "none"} />
                  </button>
                  <button
                    type="button"
                    {...gtmCtaProps(GTM_CTA.LISTING_IMAGE_REMOVE)}
                    onClick={() => removeItem(item.key)}
                    className="rounded-lg bg-white/90 p-1.5 text-gray-700 shadow-sm hover:bg-white"
                    title="Odebrat fotku"
                    aria-label="Odebrat fotku"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {isMain ? (
                  <span className="absolute bottom-1.5 left-1.5 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
                    Hlavní
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}

      {items.length < LISTING_IMAGE_MAX_FILES ? (
        <>
          {/* Mobil — foťák jako primární akce */}
          <div className="space-y-2 sm:hidden">
            <button
              type="button"
              disabled={uploadBlocked}
              {...gtmCtaProps(GTM_CTA.LISTING_IMAGE_ADD)}
              onClick={() => cameraInputRef.current?.click()}
              className={`w-full ${listingFormCameraButtonClass}`}
            >
              <Camera className="h-5 w-5" aria-hidden="true" />
              Vyfotit
            </button>
            <button
              type="button"
              disabled={uploadBlocked}
              {...gtmCtaProps(GTM_CTA.LISTING_IMAGE_ADD)}
              onClick={() => galleryInputRef.current?.click()}
              className={`w-full ${listingFormSecondaryDashedButtonClass}`}
            >
              <ImageIcon className="h-4 w-4" aria-hidden="true" />
              Vybrat z galerie
            </button>
          </div>

          {/* Desktop — drag & drop + výběr souborů */}
          <div
            role="button"
            tabIndex={uploadBlocked ? -1 : 0}
            aria-disabled={uploadBlocked}
            {...gtmCtaProps(GTM_CTA.LISTING_IMAGE_ADD)}
            onClick={() => {
              if (!uploadBlocked) galleryInputRef.current?.click();
            }}
            onKeyDown={(event) => {
              if (uploadBlocked) return;
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                galleryInputRef.current?.click();
              }
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              if (uploadBlocked) return;
              if (event.dataTransfer.files.length > 0) {
                void processFiles(event.dataTransfer.files);
              }
            }}
            className={`hidden cursor-pointer sm:block ${listingFormDropzoneClass} ${
              uploadBlocked ? "cursor-wait opacity-60" : ""
            }`}
          >
            Přetáhněte fotky sem nebo klikněte pro výběr
          </div>
        </>
      ) : null}

      {isCompressing ? (
        <p
          className={`${listingFormHintClass} flex items-center gap-2`}
          aria-live="polite"
        >
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Optimalizuji fotku…
        </p>
      ) : null}

      <input
        ref={galleryInputRef}
        type="file"
        accept={LISTING_IMAGE_GALLERY_ACCEPT}
        multiple
        className="hidden"
        onChange={handleFileInputChange}
      />

      <input
        ref={cameraInputRef}
        type="file"
        accept={LISTING_IMAGE_CAMERA_ACCEPT}
        capture="environment"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {error ? (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
});
