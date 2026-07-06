"use client";

import {
  INQUIRY_ATTACHMENT_ALLOWED_EXTENSIONS,
  INQUIRY_ATTACHMENT_MAX_FILES,
  INQUIRY_ATTACHMENT_MAX_TOTAL_BYTES,
} from "@/config/app";
import { GTM_CTA, gtmCtaProps } from "@/config/gtm-ids";
import { useCallback, useRef, useState } from "react";

export type AttachmentFile = {
  file: File;
  id: string;
};

type AttachmentDropzoneProps = {
  maxFiles?: number;
  maxTotalSizeBytes?: number;
  onFilesChange: (files: AttachmentFile[]) => void;
};

const ACCEPT = INQUIRY_ATTACHMENT_ALLOWED_EXTENSIONS.join(",");

function getExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  if (dot < 0) return "";
  return name.slice(dot).toLowerCase();
}

function isAllowedFile(file: File): boolean {
  const ext = getExtension(file.name);
  return INQUIRY_ATTACHMENT_ALLOWED_EXTENSIONS.some((allowed) => allowed === ext);
}

export function AttachmentDropzone({
  maxFiles = INQUIRY_ATTACHMENT_MAX_FILES,
  maxTotalSizeBytes = INQUIRY_ATTACHMENT_MAX_TOTAL_BYTES,
  onFilesChange,
}: AttachmentDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<AttachmentFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  const updateFiles = useCallback(
    (next: AttachmentFile[]) => {
      setFiles(next);
      onFilesChange(next);
    },
    [onFilesChange],
  );

  function addFiles(incoming: FileList | File[]) {
    setError(null);
    const list = Array.from(incoming);

    for (const file of list) {
      if (!isAllowedFile(file)) {
        setError(`Nepovolený formát: ${file.name}. Povolené: PDF, DOCX, JPG, PNG.`);
        return;
      }
    }

    const merged = [...files, ...list.map((file) => ({ file, id: crypto.randomUUID() }))];

    if (merged.length > maxFiles) {
      setError(`Maximálně ${maxFiles} soubory.`);
      return;
    }

    const totalSize = merged.reduce((sum, item) => sum + item.file.size, 0);
    if (totalSize > maxTotalSizeBytes) {
      setError("Celková velikost příloh nesmí přesáhnout 5 MB.");
      return;
    }

    updateFiles(merged);
  }

  function removeFile(id: string) {
    setError(null);
    updateFiles(files.filter((f) => f.id !== id));
  }

  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium text-gray-700">
        CV / portfolio (volitelné)
      </span>
      <p className="text-xs text-gray-500">
        Max. {maxFiles} soubory, celkem 5 MB. PDF, DOCX, JPG nebo PNG. Soubory se
        odešlou zadavateli e-mailem — na našich serverech se neukládají.
      </p>

      <div
        role="button"
        tabIndex={0}
        {...gtmCtaProps(GTM_CTA.INQUIRY_ATTACHMENT_ADD)}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files.length > 0) {
            addFiles(e.dataTransfer.files);
          }
        }}
        className="cursor-pointer rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-600 hover:border-gray-400 hover:bg-gray-100"
      >
        Přetáhněte soubory sem nebo klikněte pro výběr
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) {
            addFiles(e.target.files);
          }
          e.target.value = "";
        }}
      />

      {files.length > 0 ? (
        <ul className="space-y-1 text-sm text-gray-700">
          {files.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
            >
              <span className="truncate">{item.file.name}</span>
              <button
                type="button"
                {...gtmCtaProps(GTM_CTA.INQUIRY_ATTACHMENT_REMOVE)}
                onClick={() => removeFile(item.id)}
                className="ml-2 shrink-0 text-xs text-gray-500 underline-offset-2 hover:underline"
              >
                Odebrat
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {error ? (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export async function attachmentsToPayload(
  files: AttachmentFile[],
): Promise<
  Array<{ filename: string; content: string; contentType: string }>
> {
  const results: Array<{ filename: string; content: string; contentType: string }> =
    [];

  for (const { file } of files) {
    const content = await readFileAsBase64(file);
    results.push({
      filename: file.name,
      content,
      contentType: file.type,
    });
  }

  return results;
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("read failed"));
        return;
      }
      const base64 = result.split(",")[1];
      if (!base64) {
        reject(new Error("invalid data url"));
        return;
      }
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
