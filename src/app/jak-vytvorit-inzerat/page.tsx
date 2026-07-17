import { CreateListingGuideSteps } from "@/components/guide/CreateListingGuideSteps";
import { BackHomeLink } from "@/components/navigation/BackHomeLink";
import {
  CREATE_LISTING_GUIDE_PATH,
  CREATE_LISTING_GUIDE_UI,
} from "@/config/create-listing-guide";
import { SITE_DISPLAY_NAME } from "@/config/site";
import { emeraldPrimaryButtonClass } from "@/config/ui-primitives";
import { getSiteUrl } from "@/lib/supabase/env";
import { Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

const ui = CREATE_LISTING_GUIDE_UI;

export const metadata: Metadata = {
  title: ui.metaTitle,
  description: ui.metaDescription,
  alternates: {
    canonical: CREATE_LISTING_GUIDE_PATH,
  },
  openGraph: {
    title: ui.metaTitle,
    description: ui.metaDescription,
    url: CREATE_LISTING_GUIDE_PATH,
    type: "article",
    locale: "cs_CZ",
    siteName: SITE_DISPLAY_NAME,
  },
};

function buildHowToJsonLd() {
  const siteUrl = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: ui.pageTitle,
    description: ui.metaDescription,
    url: `${siteUrl}${CREATE_LISTING_GUIDE_PATH}`,
    step: ui.steps.map((step) => ({
      "@type": "HowToStep",
      position: step.number,
      name: step.title,
      text: step.body,
    })),
  };
}

export default function CreateListingGuidePage() {
  const howToJsonLd = buildHowToJsonLd();

  return (
    <div className="px-4 py-8 sm:px-6 sm:py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />

      <BackHomeLink />

      <article className="mx-auto max-w-5xl">
        <header className="mt-6 max-w-2xl">
          <p className="text-sm font-medium text-emerald-700">Průvodce</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
            {ui.pageTitle}
          </h1>
        </header>

        <CreateListingGuideSteps />

        <section
          className="mt-16 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-5 py-8 text-center sm:px-8"
          aria-labelledby="guide-cta-heading"
        >
          <Sparkles className="mx-auto h-8 w-8 text-emerald-600" aria-hidden />
          <h2
            id="guide-cta-heading"
            className="mt-3 text-xl font-semibold text-gray-900"
          >
            Vyzkoušejte to sami
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
            {ui.ctaHint}
          </p>
          <Link
            href="/inzerat/novy"
            className={`${emeraldPrimaryButtonClass} mx-auto mt-5 inline-flex rounded-full px-6 py-3 text-sm`}
          >
            {ui.ctaLabel}
          </Link>
        </section>

        <section className="mt-16 max-w-2xl" aria-labelledby="guide-faq-heading">
          <h2 id="guide-faq-heading" className="text-lg font-semibold text-gray-900">
            Časté otázky
          </h2>
          <dl className="mt-4 space-y-5">
            {ui.faq.map((item) => (
              <div key={item.question}>
                <dt className="font-medium text-gray-900">{item.question}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-gray-600">
                  {item.answer}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </article>
    </div>
  );
}
