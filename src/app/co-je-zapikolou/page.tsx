import { BackHomeLink } from "@/components/navigation/BackHomeLink";
import {
  ABOUT_PLATFORM_PATH,
  ABOUT_PLATFORM_UI,
} from "@/config/about-platform";
import { SITE_DISPLAY_NAME } from "@/config/site";
import { getSiteUrl } from "@/lib/supabase/env";
import type { Metadata } from "next";
import Link from "next/link";

const ui = ABOUT_PLATFORM_UI;

export const metadata: Metadata = {
  title: ui.metaTitle,
  description: ui.metaDescription,
  alternates: {
    canonical: ABOUT_PLATFORM_PATH,
  },
  openGraph: {
    title: ui.metaTitle,
    description: ui.metaDescription,
    url: ABOUT_PLATFORM_PATH,
    type: "website",
    locale: "cs_CZ",
    siteName: SITE_DISPLAY_NAME,
  },
};

function buildWebPageJsonLd() {
  const siteUrl = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: ui.pageTitle,
    description: ui.metaDescription,
    url: `${siteUrl}${ABOUT_PLATFORM_PATH}`,
    isPartOf: {
      "@type": "WebSite",
      name: SITE_DISPLAY_NAME,
      url: siteUrl,
    },
  };
}

export default function AboutPlatformPage() {
  const webPageJsonLd = buildWebPageJsonLd();

  return (
    <div className="px-4 py-8 sm:px-6 sm:py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
      />

      <BackHomeLink />

      <article className="mx-auto max-w-2xl">
        <header className="mt-6">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
            {ui.pageTitle}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-gray-600">{ui.lead}</p>
        </header>

        <div className="mt-10 space-y-8">
          {ui.sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-semibold text-gray-900">
                {section.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-600 sm:text-base">
                {section.body}
              </p>
            </section>
          ))}
        </div>

        <p className="mt-10 text-sm leading-relaxed text-gray-600">
          {ui.vopHint}{" "}
          <Link
            href={ui.vopPath}
            className="font-medium text-gray-900 underline-offset-2 hover:underline"
          >
            {ui.vopLinkLabel}
          </Link>
          .
        </p>
      </article>
    </div>
  );
}
