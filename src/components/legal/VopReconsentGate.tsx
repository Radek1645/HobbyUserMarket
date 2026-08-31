"use client";

import { acceptCurrentLegalDocuments } from "@/app/actions/legal-consent";
import {
  COOKIES_PATH,
  DSA_CONTACT_PATH,
  GDPR_PATH,
  LEGAL_UI,
  LISTING_PACKAGES_PATH,
  MARKETING_CONSENT_PATH,
  VOP_PATH,
} from "@/config/legal";
import {
  emeraldPrimaryButtonCompactClass,
  modalOverlayClass,
  modalPanelClass,
} from "@/config/ui-primitives";
import {
  isCreateListingPath,
  isLegalDocumentPath,
} from "@/lib/legal/vop-reconsent";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

const legalLinks = [
  { href: VOP_PATH, label: LEGAL_UI.vopLinkLabel },
  { href: GDPR_PATH, label: LEGAL_UI.gdprLinkLabel },
  { href: LISTING_PACKAGES_PATH, label: LEGAL_UI.listingPackagesLinkLabel },
  { href: COOKIES_PATH, label: LEGAL_UI.cookiesLinkLabel },
  { href: DSA_CONTACT_PATH, label: LEGAL_UI.dsaLinkLabel },
  { href: MARKETING_CONSENT_PATH, label: LEGAL_UI.marketingConsentLinkLabel },
] as const;

function AcceptForm({ compact }: { compact: boolean }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(
    acceptCurrentLegalDocuments,
    {},
  );

  useEffect(() => {
    if (state.ok) {
      router.refresh();
    }
  }, [state.ok, router]);

  return (
    <form action={action} className={compact ? "shrink-0" : "mt-4"}>
      <button
        type="submit"
        disabled={pending}
        className={emeraldPrimaryButtonCompactClass}
      >
        {pending ? "Ukládám…" : LEGAL_UI.reconsentAccept}
      </button>
      {state.error ? (
        <p className="mt-2 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}

function LegalDocLinks() {
  return (
    <p className="mt-3 text-sm text-gray-600">
      {legalLinks.map((link, index) => (
        <span key={link.href}>
          {index > 0 ? " · " : null}
          <Link href={link.href} className="font-medium underline underline-offset-2">
            {link.label}
          </Link>
        </span>
      ))}
    </p>
  );
}

/**
 * Re-consent po změně VOP. Na právních stránkách nic (čtení dokumentů).
 * Na /inzerat/novy blokující dialog. Jinde lišta — prohlížení zůstane.
 */
export function VopReconsentGate() {
  const pathname = usePathname();

  if (isLegalDocumentPath(pathname)) {
    return null;
  }

  if (isCreateListingPath(pathname)) {
    return (
      <div
        className={modalOverlayClass}
        role="dialog"
        aria-modal="true"
        aria-labelledby="vop-reconsent-title"
      >
        <div className={modalPanelClass}>
          <h2
            id="vop-reconsent-title"
            className="text-lg font-semibold text-gray-900"
          >
            {LEGAL_UI.reconsentTitle}
          </h2>
          <p className="mt-2 text-sm text-gray-600">{LEGAL_UI.reconsentBody}</p>
          <LegalDocLinks />
          <AcceptForm compact={false} />
        </div>
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label={LEGAL_UI.reconsentTitle}
      className="border-b border-amber-200 bg-amber-50"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-amber-950">
            {LEGAL_UI.reconsentTitle}
          </p>
          <p className="mt-0.5 text-sm text-amber-900">{LEGAL_UI.reconsentBody}</p>
          <LegalDocLinks />
        </div>
        <AcceptForm compact />
      </div>
    </div>
  );
}
