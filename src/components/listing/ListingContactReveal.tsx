"use client";

import { revealListingContact } from "@/app/actions/contact";
import { GTM_CTA, gtmCtaProps } from "@/config/gtm-ids";
import { listingFormPrimaryButtonClass, listingInquiryCtaButtonClass } from "@/config/listing-form-ui";
import { Loader2, Lock, Mail, Phone } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";

type ListingContactRevealProps = {
  postId: number;
  loginHref: string;
  isLoggedIn: boolean;
  showEmail: boolean;
  showPhone: boolean;
  /** Bez vlastní karty — uvnitř společné sekce kontaktu. */
  embedded?: boolean;
  /** Sekundární akce ve stejném sloupci jako primární tlačítko (full-width stack). */
  secondaryAction?: {
    label: string;
    onClick: () => void;
    gtmCategory?: string;
  };
  onRevealed?: () => void;
};

function ContactTeaser({
  showEmail,
  showPhone,
}: {
  showEmail: boolean;
  showPhone: boolean;
}) {
  if (!showEmail && !showPhone) return null;

  return (
    <ul
      className="mt-3 space-y-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5"
      aria-hidden
    >
      {showEmail ? (
        <li className="flex items-center gap-2 text-sm text-neutral-700">
          <Lock className="h-3.5 w-3.5 shrink-0 text-neutral-500" />
          <Mail className="h-4 w-4 shrink-0 text-neutral-500" />
          <span className="font-medium tracking-wide">•••••@••••.cz</span>
        </li>
      ) : null}
      {showPhone ? (
        <li className="flex items-center gap-2 text-sm text-neutral-700">
          <Lock className="h-3.5 w-3.5 shrink-0 text-neutral-500" />
          <Phone className="h-4 w-4 shrink-0 text-neutral-500" />
          <span className="font-medium tracking-wide">+420 ••• ••• •••</span>
        </li>
      ) : null}
    </ul>
  );
}

export function ListingContactReveal({
  postId,
  loginHref,
  isLoggedIn,
  showEmail,
  showPhone,
  embedded = false,
  secondaryAction,
  onRevealed,
}: ListingContactRevealProps) {
  const [revealed, setRevealed] = useState<{
    email: string | null;
    phone: string | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const shellClass = embedded
    ? ""
    : "rounded-2xl border border-neutral-300 bg-white p-4 sm:p-5";

  function handleReveal() {
    setError(null);
    startTransition(async () => {
      const result = await revealListingContact(postId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setRevealed({
        email: result.email ?? null,
        phone: result.phone ?? null,
      });
      onRevealed?.();
    });
  }

  if (revealed) {
    return (
      <div className={shellClass}>
        <p className="text-sm font-semibold text-neutral-900">
          Kontakt na zadavatele
        </p>
        <ul className="mt-3 space-y-2 text-sm text-neutral-900">
          {revealed.email ? (
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0 text-neutral-600" aria-hidden />
              <a
                href={`mailto:${revealed.email}`}
                className="font-medium text-blue-800 underline-offset-2 hover:underline"
              >
                {revealed.email}
              </a>
            </li>
          ) : null}
          {revealed.phone ? (
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0 text-neutral-600" aria-hidden />
              <a
                href={`tel:${revealed.phone.replace(/\s/g, "")}`}
                className="font-medium text-blue-800 underline-offset-2 hover:underline"
              >
                {revealed.phone}
              </a>
            </li>
          ) : null}
        </ul>
      </div>
    );
  }

  return (
    <div className={shellClass}>
      <p className="text-sm font-semibold text-neutral-900">
        Přímý kontakt zadavatele
      </p>

      <p className="mt-2 text-sm leading-relaxed text-neutral-700">
        {isLoggedIn
          ? "Chráníme soukromí inzerentů. Klikni pro zobrazení kontaktu, který zadavatel povolil."
          : "Chráníme soukromí inzerentů. Telefon a e-mail uvidíš po přihlášení, nebo jim napiš hned přes formulář níže."}
      </p>

      <ContactTeaser showEmail={showEmail} showPhone={showPhone} />

      {error ? (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="mt-4 flex w-full flex-col gap-3">
        {isLoggedIn ? (
          <button
            type="button"
            {...gtmCtaProps(GTM_CTA.CONTACT_REVEAL)}
            onClick={handleReveal}
            disabled={isPending}
            className={`${listingFormPrimaryButtonClass} w-full`}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                Načítám…
              </>
            ) : (
              "Zobrazit kontakt"
            )}
          </button>
        ) : (
          <Link
            href={loginHref}
            className={`${listingFormPrimaryButtonClass} w-full`}
          >
            Přihlásit se nebo registrovat
          </Link>
        )}

        {secondaryAction ? (
          <button
            type="button"
            {...gtmCtaProps(GTM_CTA.INQUIRY_OPEN, {
              category: secondaryAction.gtmCategory,
            })}
            onClick={secondaryAction.onClick}
            className={listingInquiryCtaButtonClass}
          >
            {secondaryAction.label}
          </button>
        ) : null}
      </div>
    </div>
  );
}
