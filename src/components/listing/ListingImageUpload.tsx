"use client";

import {
  LISTING_IMAGE_ACCEPT,
  LISTING_IMAGE_MAX_FILES,
  LISTING_IMAGE_MAX_FILE_BYTES,
} from "@/config/app";
import { GTM_CTA, gtmCtaProps } from "@/config/gtm-ids";
import {
  listingFormDropzoneClass,
  listingFormHintClass,
  listingFormLabelClass,
  listingFormSecondaryButtonClass,
} from "@/config/listing-form-ui";
import { compressListingImage } from "@/lib/images/compress-listing-image";
import {
  validateListingImageFile,
  validateListingImageSourceFile,
} from "@/lib/posts/listing-images";
import type { ModerationImagePayload } from "@/lib/moderation/prepare-moderation-images";
import {
  prepareModerationImages,
  type ModerationImageSource,
} from "@/lib/moderation/prepare-moderation-images";
import type { ListingImagePreview } from "@/types/post";
import { Star, X, Camera, ImageIcon } from "lucide-react";
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
};

type ImageItem =
  | {
      key: string;
      kind: "existing";
      id: string;
      url: string;
    }
  | {
      key: string;
      kind: "new";
      file: File;
      previewUrl: string;
    };

type ListingImageUploadProps = {
  initialImages?: ListingImagePreview[];
};

export const ListingImageUpload = forwardRef<
  ListingImageUploadHandle,
  ListingImageUploadProps
>(function ListingImageUpload({ initialImages = [] }, ref) {
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
      })),
  );
  const [mainKey, setMainKey] = useState(() => {
    const main = initialImages.find((image) => image.isMain);
    return main ? `e:${main.id}` : initialImages[0] ? `e:${initialImages[0].id}` : "";
  });
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

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
          formData.append("listingImages", item.file);
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

    const sources: ModerationImageSource[] = items.map((item) =>
      item.kind === "new"
        ? { kind: "file", file: item.file }
        : { kind: "url", url: item.url },
    );
    const mainIndex = Math.max(
      0,
      items.findIndex((item) => item.key === (mainKey || items[0]?.key)),
    );

    return prepareModerationImages(sources, mainIndex);
  }, [items, mainKey]);

  useImperativeHandle(
    ref,
    () => ({ appendToFormData, hasImageChanges, getModerationImages }),
    [appendToFormData, getModerationImages, hasImageChanges],
  );

  async function processFiles(incoming: FileList | File[]) {
    setError(null);
    setIsCompressing(true);

    try {
      const list = Array.from(incoming);
      const nextItems = [...items];

      for (const file of list) {
        const sourceError = validateListingImageSourceFile(file);
        if (sourceError) {
          setError(sourceError);
          return;
        }

        if (nextItems.length >= LISTING_IMAGE_MAX_FILES) {
          setError(`Maximálně ${LISTING_IMAGE_MAX_FILES} fotek.`);
          return;
        }

        let compressed: File;
        try {
          compressed = await compressListingImage(file);
        } catch (compressError) {
          setError(
            compressError instanceof Error
              ? compressError.message
              : "Fotku se nepodařilo zpracovat. Zkus jiný soubor.",
          );
          return;
        }

        const storedError = validateListingImageFile(compressed);
        if (storedError) {
          setError(storedError);
          return;
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
    }

    const nextItems = items.filter((item) => item.key !== key);
    setItems(nextItems);

    if (mainKey === key) {
      setMainKey(nextItems[0]?.key ?? "");
    }
  }

  function handleFileInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.target.files?.length) {
      void processFiles(event.target.files);
    }
    event.target.value = "";
  }

  return (
    <div className="space-y-3">
      <div>
        <span className={listingFormLabelClass}>Fotky</span>
        <p className={listingFormHintClass}>
          Volitelné, max. {LISTING_IMAGE_MAX_FILES} fotek. Snímky z foťáku nebo
          galerie se automaticky zmenší (max.{" "}
          {Math.round(LISTING_IMAGE_MAX_FILE_BYTES / (1024 * 1024))} MB každá).
          Hvězdičkou zvolíš náhled na homepage. Všechny fotky procházejí
          bezpečnostní AI kontrolou.
        </p>
      </div>

      {items.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((item) => {
            const preview = item.kind === "existing" ? item.url : item.previewUrl;
            const isMain = item.key === mainKey;

            return (
              <li
                key={item.key}
                className="relative overflow-hidden rounded-xl border border-neutral-400 bg-neutral-50"
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
              disabled={isCompressing}
              {...gtmCtaProps(GTM_CTA.LISTING_IMAGE_ADD)}
              onClick={() => cameraInputRef.current?.click()}
              className={`flex w-full ${listingFormSecondaryButtonClass} py-3.5`}
            >
              <Camera className="h-5 w-5" aria-hidden="true" />
              Vyfotit
            </button>
            <button
              type="button"
              disabled={isCompressing}
              {...gtmCtaProps(GTM_CTA.LISTING_IMAGE_ADD)}
              onClick={() => galleryInputRef.current?.click()}
              className={`flex w-full ${listingFormSecondaryButtonClass} border-dashed py-3`}
            >
              <ImageIcon className="h-4 w-4" aria-hidden="true" />
              Vybrat z galerie
            </button>
          </div>

          {/* Desktop — drag & drop + výběr souborů */}
          <div
            role="button"
            tabIndex={isCompressing ? -1 : 0}
            aria-disabled={isCompressing}
            {...gtmCtaProps(GTM_CTA.LISTING_IMAGE_ADD)}
            onClick={() => {
              if (!isCompressing) galleryInputRef.current?.click();
            }}
            onKeyDown={(event) => {
              if (isCompressing) return;
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                galleryInputRef.current?.click();
              }
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              if (isCompressing) return;
              if (event.dataTransfer.files.length > 0) {
                void processFiles(event.dataTransfer.files);
              }
            }}
            className={`hidden cursor-pointer sm:block ${listingFormDropzoneClass} disabled:cursor-wait disabled:opacity-60`}
          >
            Přetáhni fotky sem nebo klikni pro výběr
          </div>
        </>
      ) : null}

      {isCompressing ? (
        <p className={listingFormHintClass} aria-live="polite">
          Optimalizuji fotku…
        </p>
      ) : null}

      <input
        ref={galleryInputRef}
        type="file"
        accept={LISTING_IMAGE_ACCEPT}
        multiple
        className="hidden"
        onChange={handleFileInputChange}
      />

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
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
