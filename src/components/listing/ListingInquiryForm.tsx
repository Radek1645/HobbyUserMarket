"use client";

import {
  INQUIRY_MESSAGE_MAX_LENGTH,
  INQUIRY_MESSAGE_MIN_LENGTH,
  INQUIRY_SENDER_NAME_MAX_LENGTH,
} from "@/config/app";
import { GTM_CTA, gtmCtaProps } from "@/config/gtm-ids";
import { listingInquiryCtaButtonClass } from "@/config/listing-form-ui";
import {
  getInquiryCtaLabel,
  getInquiryHeading,
  getInquirySubmitLabel,
} from "@/lib/inquiry/labels";
import type { CategoryType } from "@/types/post";
import {
  AttachmentDropzone,
  attachmentsToPayload,
  type AttachmentFile,
} from "./AttachmentDropzone";
import { useState } from "react";

type ListingInquiryFormProps = {
  postId: number;
  postTitle: string;
  categoryType: CategoryType;
  /** Uvnitř společné karty kontaktu na detailu — bez odděleného rámečku u CTA. */
  embedded?: boolean;
  /** Řízené otevření formuláře (tlačítko může být v nadřazeném stacku). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Skryje vlastní trigger — použij s `open` / `onOpenChange`. */
  hideTrigger?: boolean;
};

const inputClass =
  "mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-200";

const labelClass = "block text-sm font-medium text-gray-700";

export function ListingInquiryForm({
  postId,
  postTitle,
  categoryType,
  embedded = false,
  open: openControlled,
  onOpenChange,
  hideTrigger = false,
}: ListingInquiryFormProps) {
  const [openInternal, setOpenInternal] = useState(false);
  const open = openControlled ?? openInternal;

  function setOpen(next: boolean) {
    if (onOpenChange) {
      onOpenChange(next);
    } else {
      setOpenInternal(next);
    }
  }
  const [senderName, setSenderName] = useState("");
  const [senderContact, setSenderContact] = useState("");
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isJob = categoryType === "prace";
  const messageTrimmed = message.trim();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (senderName.trim().length < 1) {
      setError("Zadej jméno.");
      return;
    }

    if (senderContact.trim().length < 5) {
      setError("Zadej e-mail nebo telefon.");
      return;
    }

    if (messageTrimmed.length < INQUIRY_MESSAGE_MIN_LENGTH) {
      setError(`Zpráva musí mít alespoň ${INQUIRY_MESSAGE_MIN_LENGTH} znaků.`);
      return;
    }

    setPending(true);

    try {
      const attachmentPayload =
        isJob && attachments.length > 0
          ? await attachmentsToPayload(attachments)
          : undefined;

      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          senderName: senderName.trim(),
          senderContact: senderContact.trim(),
          message: messageTrimmed,
          attachments: attachmentPayload,
        }),
      });

      const data = (await res.json()) as { error?: string; ok?: boolean };

      if (!res.ok) {
        setError(data.error ?? "Odeslání se nepodařilo.");
        return;
      }

      setSuccess(true);
      setOpen(false);
      setSenderName("");
      setSenderContact("");
      setMessage("");
      setAttachments([]);
    } catch {
      setError("Odeslání se nepodařilo. Zkontroluj připojení.");
    } finally {
      setPending(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-4 text-sm text-green-900">
        <p className="font-medium">Odesláno.</p>
        <p className="mt-1 text-green-800">
          Zadavatel dostane tvůj kontakt e-mailem a může ti odpovědět přímo.
        </p>
        <button
          type="button"
          {...gtmCtaProps(GTM_CTA.INQUIRY_SEND_ANOTHER)}
          onClick={() => setSuccess(false)}
          className="mt-3 text-sm font-medium text-green-900 underline-offset-2 hover:underline"
        >
          Odeslat další zprávu
        </button>
      </div>
    );
  }

  if (!open) {
    if (hideTrigger) {
      return null;
    }

    return (
      <button
        type="button"
        {...gtmCtaProps(GTM_CTA.INQUIRY_OPEN, { category: categoryType })}
        onClick={() => setOpen(true)}
        className={listingInquiryCtaButtonClass}
      >
        {getInquiryCtaLabel(categoryType)}
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={
        embedded
          ? "mt-4 space-y-4 border-t border-gray-100 pt-4"
          : "space-y-4 rounded-2xl border border-gray-200 bg-white p-4 sm:p-6"
      }
    >
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          {getInquiryHeading(categoryType)}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Inzerát: {postTitle}
        </p>
      </div>

      <div>
        <label htmlFor="inquiry-name" className={labelClass}>
          Jméno <span className="text-red-600">*</span>
        </label>
        <input
          id="inquiry-name"
          required
          maxLength={INQUIRY_SENDER_NAME_MAX_LENGTH}
          value={senderName}
          onChange={(e) => setSenderName(e.target.value)}
          className={inputClass}
          autoComplete="name"
        />
      </div>

      <div>
        <label htmlFor="inquiry-contact" className={labelClass}>
          E-mail nebo telefon <span className="text-red-600">*</span>
        </label>
        <input
          id="inquiry-contact"
          required
          value={senderContact}
          onChange={(e) => setSenderContact(e.target.value)}
          className={inputClass}
          placeholder="např. jan@email.cz nebo +420…"
          autoComplete="email"
        />
      </div>

      <div>
        <label htmlFor="inquiry-message" className={labelClass}>
          Zpráva <span className="text-red-600">*</span>
        </label>
        <textarea
          id="inquiry-message"
          required
          rows={4}
          minLength={INQUIRY_MESSAGE_MIN_LENGTH}
          maxLength={INQUIRY_MESSAGE_MAX_LENGTH}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={inputClass}
          placeholder={
            isJob
              ? "Krátce představ sebe a proč máš zájem o tuto pozici…"
              : categoryType === "udalost"
                ? "Např. kolik vás přijde, máte nějaké alergie…"
                : "Co tě na inzerátu zajímá…"
          }
        />
        <p className="mt-1 text-xs text-gray-500">
          {message.length}/{INQUIRY_MESSAGE_MAX_LENGTH}
        </p>
      </div>

      {isJob ? (
        <AttachmentDropzone onFilesChange={setAttachments} />
      ) : null}

      {error ? (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          {...gtmCtaProps(GTM_CTA.INQUIRY_CANCEL)}
          onClick={() => setOpen(false)}
          disabled={pending}
          className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Zrušit
        </button>
        <button
          type="submit"
          {...gtmCtaProps(GTM_CTA.INQUIRY_SUBMIT, { category: categoryType })}
          disabled={pending}
          className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {pending ? "Odesílám…" : getInquirySubmitLabel(categoryType)}
        </button>
      </div>
    </form>
  );
}
