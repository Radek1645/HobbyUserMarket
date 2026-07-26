import { FaqAccordion } from "@/components/faq/FaqAccordion";
import { LegalLinkedText } from "@/components/legal/LegalLinkedText";
import { BackHomeLink } from "@/components/navigation/BackHomeLink";
import { FAQ_ITEMS, FAQ_PATH, FAQ_UI } from "@/config/faq";
import { SITE_DISPLAY_NAME } from "@/config/site";
import { getSiteUrl } from "@/lib/supabase/env";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: FAQ_UI.metaTitle,
  description: FAQ_UI.metaDescription,
  alternates: {
    canonical: FAQ_PATH,
  },
  openGraph: {
    title: FAQ_UI.metaTitle,
    description: FAQ_UI.metaDescription,
    url: FAQ_PATH,
    type: "website",
    locale: "cs_CZ",
    siteName: SITE_DISPLAY_NAME,
  },
};

function buildFaqJsonLd() {
  const siteUrl = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
    url: `${siteUrl}${FAQ_PATH}`,
  };
}

export default function FaqPage() {
  const faqJsonLd = buildFaqJsonLd();

  return (
    <div className="px-4 py-8 sm:px-6 sm:py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <BackHomeLink />

      <article className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold text-gray-900">
          {FAQ_UI.pageTitle}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-600">
          <LegalLinkedText text={FAQ_UI.intro} />
        </p>

        <FaqAccordion items={FAQ_ITEMS} />
      </article>
    </div>
  );
}
