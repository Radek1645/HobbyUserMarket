import { BackHomeLink } from "@/components/navigation/BackHomeLink";
import { OPERATOR_CONTACT_EMAIL } from "@/config/app";
import { KONTAKT_PAGE_UI, KONTAKT_PATH } from "@/config/footer";
import { SITE_DISPLAY_NAME } from "@/config/site";
import { getSiteUrl } from "@/lib/supabase/env";
import type { Metadata } from "next";

const ui = KONTAKT_PAGE_UI;

export const metadata: Metadata = {
  title: ui.metaTitle,
  description: ui.metaDescription,
  alternates: {
    canonical: KONTAKT_PATH,
  },
  openGraph: {
    title: ui.metaTitle,
    description: ui.metaDescription,
    url: KONTAKT_PATH,
    type: "website",
    locale: "cs_CZ",
    siteName: SITE_DISPLAY_NAME,
  },
};

function buildOperatorContactJsonLd() {
  const siteUrl = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: ui.providerName,
    email: OPERATOR_CONTACT_EMAIL,
    identifier: {
      "@type": "PropertyValue",
      propertyID: ui.dataBoxLabel,
      value: ui.dataBoxId,
    },
    worksFor: {
      "@type": "WebSite",
      name: SITE_DISPLAY_NAME,
      url: siteUrl,
    },
    url: `${siteUrl}${KONTAKT_PATH}`,
  };
}

export default function KontaktPage() {
  const operatorContactJsonLd = buildOperatorContactJsonLd();

  return (
    <div className="px-4 py-8 sm:px-6 sm:py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(operatorContactJsonLd) }}
      />

      <BackHomeLink />

      <div className="mx-auto max-w-lg">
        <h1 className="text-2xl font-semibold text-gray-900">{ui.pageTitle}</h1>

        <section className="mt-6 space-y-4 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              {ui.providerHeading}
            </h2>
            <p className="mt-1 text-base text-gray-900">{ui.providerName}</p>
            <p className="text-sm text-gray-600">{ui.providerLegalForm}</p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              {ui.emailLabel}
            </h2>
            <a
              href={`mailto:${OPERATOR_CONTACT_EMAIL}`}
              className="mt-1 inline-block font-medium text-gray-900 underline-offset-2 hover:underline"
            >
              {OPERATOR_CONTACT_EMAIL}
            </a>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              {ui.dataBoxLabel}
            </h2>
            <p className="mt-1 font-mono text-base text-gray-900">{ui.dataBoxId}</p>
          </div>
        </section>

        <p className="mt-4 text-sm leading-relaxed text-gray-600">
          {ui.responseHint}
        </p>
      </div>
    </div>
  );
}
