import { BackHomeLink } from "@/components/navigation/BackHomeLink";
import { KONTAKT_PAGE_UI, KONTAKT_PATH } from "@/config/footer";
import {
  SITE_DISPLAY_NAME,
  SITE_OPERATOR_CONTACT_EMAIL,
  SITE_OPERATOR_REGISTERED_OFFICE_PARTS,
} from "@/config/site";
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
    email: SITE_OPERATOR_CONTACT_EMAIL,
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE_OPERATOR_REGISTERED_OFFICE_PARTS.streetAddress,
      postalCode: SITE_OPERATOR_REGISTERED_OFFICE_PARTS.postalCode,
      addressLocality: SITE_OPERATOR_REGISTERED_OFFICE_PARTS.addressLocality,
      addressCountry: SITE_OPERATOR_REGISTERED_OFFICE_PARTS.addressCountry,
    },
    identifier: [
      {
        "@type": "PropertyValue",
        propertyID: ui.icoLabel,
        value: ui.ico,
      },
      {
        "@type": "PropertyValue",
        propertyID: ui.dataBoxLabel,
        value: ui.dataBoxId,
      },
    ],
    worksFor: {
      "@type": "WebSite",
      name: SITE_DISPLAY_NAME,
      url: siteUrl,
    },
    url: `${siteUrl}${KONTAKT_PATH}`,
  };
}

function serializeOperatorJsonLd(
  data: ReturnType<typeof buildOperatorContactJsonLd>,
): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export default function KontaktPage() {
  const operatorContactJsonLd = buildOperatorContactJsonLd();

  return (
    <div className="px-4 py-8 sm:px-6 sm:py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeOperatorJsonLd(operatorContactJsonLd),
        }}
      />

      <BackHomeLink />

      <div className="mx-auto max-w-lg">
        <h1 className="text-2xl font-semibold text-gray-900">{ui.pageTitle}</h1>

        <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 text-base leading-relaxed text-gray-900 sm:p-6">
          <p className="font-semibold">{ui.providerName}</p>
          <p>
            {ui.registeredOfficeLabel}: {ui.registeredOffice}
          </p>
          <p>
            {ui.icoLabel}: {ui.ico}
          </p>
          <p className="mt-3">{ui.legalFormText}</p>

          <p className="mt-4 font-semibold">{ui.contactHeading}:</p>
          <p>
            {ui.emailLabel}:{" "}
            <a
              href={`mailto:${SITE_OPERATOR_CONTACT_EMAIL}`}
              className="font-medium underline-offset-2 hover:underline"
            >
              {SITE_OPERATOR_CONTACT_EMAIL}
            </a>
          </p>
          <p>
            {ui.dataBoxLabel}: {ui.dataBoxId}
          </p>
        </section>

        <p className="mt-4 text-sm leading-relaxed text-gray-600">
          {ui.responseHint}
        </p>
      </div>
    </div>
  );
}
