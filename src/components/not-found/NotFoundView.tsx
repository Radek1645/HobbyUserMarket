import { NOT_FOUND_UI } from "@/config/not-found";
import { GTM_CTA, gtmCtaProps } from "@/config/gtm-ids";
import {
  listingCardSubcategoryBadgeClass,
  preferredSoftButtonClass,
  secondaryDashedButtonClass,
} from "@/config/ui-primitives";
import { MapPinOff } from "lucide-react";
import Link from "next/link";

const ui = NOT_FOUND_UI;

function MissingListingCard() {
  return (
    <div
      aria-hidden="true"
      className="mx-auto w-full max-w-[16.5rem] overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm"
    >
      <div className="relative aspect-[4/5] bg-gradient-to-br from-emerald-50 to-stone-100">
        <span className="absolute inset-0 flex items-center justify-center select-none text-[6.75rem] font-black leading-none tracking-tighter text-emerald-900/[0.07]">
          404
        </span>
        <MapPinOff
          className="absolute left-1/2 top-[40%] h-12 w-12 -translate-x-1/2 -translate-y-1/2 text-emerald-600/50"
          strokeWidth={1.25}
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/35 to-transparent px-3 pb-3 pt-10">
          <span className={listingCardSubcategoryBadgeClass}>{ui.cardBadge}</span>
          <p className="mt-1.5 text-base font-semibold leading-snug text-white">
            {ui.cardTitle}
          </p>
          <p className="mt-1 text-sm font-semibold text-white">{ui.cardPrice}</p>
        </div>
      </div>
      <p className="px-3 py-2 text-xs text-gray-500">{ui.cardLocation}</p>
    </div>
  );
}

export function NotFoundView() {
  return (
    <div className="flex min-h-[70vh] flex-col justify-center px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto w-full max-w-lg text-center">
        <MissingListingCard />

        <p className="mt-8 text-sm font-medium text-emerald-700">{ui.eyebrow}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
          {ui.title}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-gray-600">{ui.lead}</p>

        <div className="mx-auto mt-8 flex w-full max-w-xs flex-col gap-2">
          <Link
            href={ui.homeHref}
            aria-label={ui.homeAriaLabel}
            className={`${preferredSoftButtonClass} w-full`}
            {...gtmCtaProps(GTM_CTA.NOT_FOUND_HOME)}
          >
            {ui.homeCta}
          </Link>
          <Link
            href={ui.createHref}
            className={`${secondaryDashedButtonClass} w-full`}
            {...gtmCtaProps(GTM_CTA.NOT_FOUND_CREATE_LISTING)}
          >
            {ui.createCta}
          </Link>
        </div>

        <p className="mt-6 text-sm text-gray-500">
          {ui.contactHint}{" "}
          <Link
            href={ui.contactHref}
            className="font-medium text-gray-800 underline-offset-2 hover:underline"
            {...gtmCtaProps(GTM_CTA.NOT_FOUND_CONTACT)}
          >
            {ui.contactLinkLabel}
          </Link>
        </p>
      </div>
    </div>
  );
}
