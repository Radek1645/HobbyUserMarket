"use client";

import {
  LISTING_IMAGE_ACCEPT,
  LISTING_IMAGE_MAX_FILE_BYTES,
} from "@/config/app";
import {
  COMPARE_SUGGEST_DEFAULT_ARM_A,
  COMPARE_SUGGEST_DEFAULT_ARM_B,
  COMPARE_SUGGEST_MAX_IMAGES,
  COMPARE_SUGGEST_UI,
} from "@/config/compare-suggest-from-photos";
import {
  listingFormDropzoneActiveClass,
  listingFormDropzoneClass,
  listingFormPrimaryButtonClass,
} from "@/config/listing-form-ui";
import { compressListingImage } from "@/lib/images/compress-listing-image";
import { snapshotListingImageFiles } from "@/lib/images/read-listing-image-file";
import {
  compareSuggestFromPhotos,
  type CompareSuggestArmError,
  type CompareSuggestArmOk,
  type CompareSuggestProvider,
} from "@/lib/mod/compare-suggest-client";
import { prepareModerationImages } from "@/lib/moderation/prepare-moderation-images";
import {
  validateListingImageFile,
  validateListingImageSourceFile,
} from "@/lib/posts/listing-images";
import { Camera, CloudUpload, Loader2, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";

type LocalPhoto = {
  key: string;
  file: File;
  previewUrl: string;
};

type ArmFormState = {
  label: string;
  provider: CompareSuggestProvider;
  model: string;
};

function ArmResultCard({
  heading,
  result,
}: {
  heading: string;
  result: CompareSuggestArmOk | CompareSuggestArmError | null;
}) {
  if (!result) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-gray-900">{heading}</h3>
        <p className="mt-2 text-sm text-gray-500">Zatím bez výsledku.</p>
      </div>
    );
  }

  if (!result.ok) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
        <h3 className="text-sm font-semibold text-gray-900">{heading}</h3>
        <p className="mt-1 text-xs text-gray-600">
          {result.provider} · {result.model}
        </p>
        <p className="mt-3 text-sm text-red-800">
          {COMPARE_SUGGEST_UI.errorLabel}: {result.errorCode}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-gray-900">{heading}</h3>
      <p className="mt-1 text-xs text-gray-600">
        {result.provider} · {result.model} · {COMPARE_SUGGEST_UI.latencyLabel}{" "}
        {result.latencyMs} ms
      </p>
      <dl className="mt-4 space-y-3 text-sm">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
            {COMPARE_SUGGEST_UI.titleLabel}
          </dt>
          <dd className="mt-1 text-gray-900">{result.title}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
            {COMPARE_SUGGEST_UI.descriptionLabel}
          </dt>
          <dd className="mt-1 whitespace-pre-wrap text-gray-800">
            {result.description}
          </dd>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
              {COMPARE_SUGGEST_UI.categoryLabel}
            </dt>
            <dd className="mt-1 font-mono text-xs text-gray-900">
              {result.categoryType}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
              {COMPARE_SUGGEST_UI.subcategoryLabel}
            </dt>
            <dd className="mt-1 font-mono text-xs text-gray-900">
              {result.subcategorySlug ?? COMPARE_SUGGEST_UI.emptySubcategory}
            </dd>
          </div>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
            {COMPARE_SUGGEST_UI.confidenceLabel}
          </dt>
          <dd className="mt-1 text-gray-900">
            {result.confidenceScore.toFixed(2)}
          </dd>
        </div>
      </dl>
    </div>
  );
}

export function PrefillCompareLab() {
  const inputRef = useRef<HTMLInputElement>(null);
  const submitLockRef = useRef(false);
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [armAForm, setArmAForm] = useState<ArmFormState>(
    COMPARE_SUGGEST_DEFAULT_ARM_A,
  );
  const [armBForm, setArmBForm] = useState<ArmFormState>(
    COMPARE_SUGGEST_DEFAULT_ARM_B,
  );
  const [armAResult, setArmAResult] = useState<
    CompareSuggestArmOk | CompareSuggestArmError | null
  >(null);
  const [armBResult, setArmBResult] = useState<
    CompareSuggestArmOk | CompareSuggestArmError | null
  >(null);

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
    const next: LocalPhoto[] = [];
    const snapshots = await snapshotListingImageFiles(incoming);

    for (const snapshot of snapshots) {
      if (!snapshot.ok) {
        setError(snapshot.error);
        continue;
      }
      const file = snapshot.file;
      const sourceError = validateListingImageSourceFile(file);
      if (sourceError) {
        setError(sourceError);
        continue;
      }

      let compressed: File;
      try {
        compressed = await compressListingImage(file);
      } catch {
        setError("Fotku se nepodařilo zpracovat.");
        continue;
      }

      if (compressed.size > LISTING_IMAGE_MAX_FILE_BYTES) {
        setError("Fotka je po kompresi stále příliš velká.");
        continue;
      }

      const fileError = validateListingImageFile(compressed);
      if (fileError) {
        setError(fileError);
        continue;
      }

      next.push({
        key: crypto.randomUUID(),
        file: compressed,
        previewUrl: URL.createObjectURL(compressed),
      });
    }

    if (next.length === 0) return;

    setPhotos((prev) => {
      const merged = [...prev, ...next];
      if (merged.length <= COMPARE_SUGGEST_MAX_IMAGES) return merged;
      const kept = merged.slice(-COMPARE_SUGGEST_MAX_IMAGES);
      for (const photo of merged.slice(0, merged.length - kept.length)) {
        URL.revokeObjectURL(photo.previewUrl);
      }
      setError(COMPARE_SUGGEST_UI.tooManyPhotos);
      return kept;
    });
  }, []);

  function removePhoto(key: string) {
    setPhotos((prev) => {
      const target = prev.find((photo) => photo.key === key);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((photo) => photo.key !== key);
    });
  }

  async function handleCompare() {
    if (submitLockRef.current || busy) return;
    if (photos.length < 1) {
      setError(COMPARE_SUGGEST_UI.needPhotos);
      return;
    }

    submitLockRef.current = true;
    setBusy(true);
    setError(null);
    setArmAResult(null);
    setArmBResult(null);

    try {
      const prepared = await prepareModerationImages(
        photos.map((photo) => ({
          kind: "file" as const,
          key: photo.key,
          file: photo.file,
        })),
        0,
      );
      if (!prepared) {
        setError(COMPARE_SUGGEST_UI.needPhotos);
        return;
      }

      const result = await compareSuggestFromPhotos({
        imageReferences: prepared.payload.imageReferences,
        armA: armAForm,
        armB: armBForm,
      });

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setArmAResult(result.armA);
      setArmBResult(result.armB);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : COMPARE_SUGGEST_UI.technicalError,
      );
    } finally {
      submitLockRef.current = false;
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {([
          { key: "a", form: armAForm, setForm: setArmAForm, heading: COMPARE_SUGGEST_UI.armAHeading },
          { key: "b", form: armBForm, setForm: setArmBForm, heading: COMPARE_SUGGEST_UI.armBHeading },
        ] as const).map((arm) => (
          <div
            key={arm.key}
            className="rounded-2xl border border-gray-200 bg-white p-4"
          >
            <h2 className="text-sm font-semibold text-gray-900">
              {arm.heading}
            </h2>
            <label className="mt-3 block text-xs font-medium text-gray-600">
              {COMPARE_SUGGEST_UI.providerLabel}
              <select
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                value={arm.form.provider}
                disabled={busy}
                onChange={(event) =>
                  arm.setForm((prev) => ({
                    ...prev,
                    provider: event.target.value as CompareSuggestProvider,
                  }))
                }
              >
                <option value="gemini">gemini</option>
                <option value="openai">openai</option>
              </select>
            </label>
            <label className="mt-3 block text-xs font-medium text-gray-600">
              {COMPARE_SUGGEST_UI.modelLabel}
              <input
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm text-gray-900"
                value={arm.form.model}
                disabled={busy}
                onChange={(event) =>
                  arm.setForm((prev) => ({
                    ...prev,
                    model: event.target.value,
                  }))
                }
              />
            </label>
          </div>
        ))}
      </div>

      <div>
        <input
          ref={inputRef}
          type="file"
          accept={LISTING_IMAGE_ACCEPT}
          multiple
          className="sr-only"
          disabled={busy}
          onChange={(event) => {
            const input = event.currentTarget;
            if (!input.files?.length) return;
            const list = Array.from(input.files);
            void addFiles(list).finally(() => {
              input.value = "";
            });
          }}
        />
        <button
          type="button"
          disabled={busy}
          className={`${listingFormDropzoneClass} ${
            dragActive ? listingFormDropzoneActiveClass : ""
          }`}
          onClick={() => inputRef.current?.click()}
          onDragEnter={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setDragActive(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setDragActive(false);
            if (event.dataTransfer.files?.length) {
              void addFiles(event.dataTransfer.files);
            }
          }}
        >
          <CloudUpload className="mx-auto h-8 w-8 text-gray-400" aria-hidden />
          <span className="mt-2 block text-sm font-medium text-gray-900">
            {COMPARE_SUGGEST_UI.dropzoneIdle}
          </span>
          <span className="mt-1 block text-xs text-gray-500">
            {COMPARE_SUGGEST_UI.dropzoneHint}
          </span>
        </button>

        {photos.length > 0 ? (
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {photos.map((photo) => (
              <li key={photo.key} className="relative overflow-hidden rounded-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.previewUrl}
                  alt=""
                  className="aspect-square w-full object-cover"
                />
                <button
                  type="button"
                  disabled={busy}
                  className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white"
                  onClick={() => removePhoto(photo.key)}
                  aria-label="Odebrat fotku"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 flex items-center gap-2 text-xs text-gray-500">
            <Camera className="h-3.5 w-3.5" aria-hidden />
            Stejné renditions jako u produkčního prefillu (1024 px).
          </p>
        )}
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className={listingFormPrimaryButtonClass}
          disabled={busy || photos.length < 1}
          onClick={() => void handleCompare()}
        >
          {busy ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              {COMPARE_SUGGEST_UI.runningLabel}
            </>
          ) : (
            COMPARE_SUGGEST_UI.runLabel
          )}
        </button>
        {photos.length > 0 ? (
          <button
            type="button"
            disabled={busy}
            className="rounded-xl px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
            onClick={clearPhotos}
          >
            Vymazat fotky
          </button>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ArmResultCard
          heading={COMPARE_SUGGEST_UI.armAHeading}
          result={armAResult}
        />
        <ArmResultCard
          heading={COMPARE_SUGGEST_UI.armBHeading}
          result={armBResult}
        />
      </div>
    </div>
  );
}
