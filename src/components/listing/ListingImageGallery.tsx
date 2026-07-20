"use client";

import { ListingImageLightbox } from "@/components/listing/ListingImageLightbox";
import type { ListingImagePreview } from "@/types/post";
import { ZoomIn } from "lucide-react";
import { useMemo, useState } from "react";

type ListingImageGalleryProps = {
  images: ListingImagePreview[];
  title: string;
  /** AI alt hlavní fotky; fallback = title. */
  imageAlt?: string | null;
};

export function ListingImageGallery({
  images,
  title,
  imageAlt,
}: ListingImageGalleryProps) {
  const mainAlt = imageAlt?.trim() || title;
  const sorted = useMemo(
    () => [...images].sort((a, b) => a.sortOrder - b.sortOrder),
    [images],
  );
  const defaultMain =
    sorted.find((image) => image.isMain)?.id ?? sorted[0]?.id ?? null;
  const [activeId, setActiveId] = useState(defaultMain);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (sorted.length === 0) return null;

  const activeIndex = Math.max(
    0,
    sorted.findIndex((image) => image.id === activeId),
  );
  const active = sorted[activeIndex] ?? sorted[0]!;

  function openLightbox(imageId?: string) {
    if (imageId) setActiveId(imageId);
    setLightboxOpen(true);
  }

  return (
    <>
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => openLightbox(active.id)}
          className="group relative flex w-full min-h-[240px] max-h-[min(70vh,520px)] cursor-zoom-in items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-100"
          aria-label="Zvětšit fotku"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={active.url}
            alt={mainAlt}
            className="max-h-[min(70vh,520px)] w-full object-contain"
          />
          <span className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg bg-black/55 px-2.5 py-1.5 text-xs font-medium text-white opacity-80 sm:opacity-0 sm:transition sm:group-hover:opacity-100 sm:group-focus-visible:opacity-100">
            <ZoomIn className="h-3.5 w-3.5" aria-hidden="true" />
            Zvětšit
          </span>
        </button>

        {sorted.length > 1 ? (
          <ul className="flex gap-2 overflow-x-auto pb-1">
            {sorted.map((image, index) => {
              const isActive = image.id === active.id;
              return (
                <li key={image.id} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveId(image.id)}
                    className={`overflow-hidden rounded-lg border transition ${
                      isActive
                        ? "border-gray-900 ring-2 ring-gray-900/20"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    aria-label={`Zobrazit fotku ${index + 1}`}
                    aria-current={isActive ? "true" : undefined}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image.url}
                      alt={mainAlt}
                      className="h-16 w-20 object-cover sm:h-20 sm:w-24"
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>

      {lightboxOpen ? (
        <ListingImageLightbox
          images={sorted.map((image) => ({ id: image.id, url: image.url }))}
          activeIndex={activeIndex}
          title={title}
          imageAlt={mainAlt}
          onClose={() => setLightboxOpen(false)}
          onActiveIndexChange={(index) => {
            const image = sorted[index];
            if (image) setActiveId(image.id);
          }}
        />
      ) : null}
    </>
  );
}
